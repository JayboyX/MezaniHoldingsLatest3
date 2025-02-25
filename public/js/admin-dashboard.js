document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('adminToken');

    if (!token) {
        window.location.href = '/admin-login.html';
        return;
    }

    try {
        const [inquiriesResponse, statsResponse] = await Promise.all([
            fetch('/api/inquiries', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }),
            fetch('/api/stats', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
        ]);

        if (!inquiriesResponse.ok || !statsResponse.ok) {
            throw new Error('Failed to fetch data');
        }

        const inquiries = await inquiriesResponse.json();
        const stats = await statsResponse.json();

        renderInquiries(inquiries);
        renderStats(stats);

    } catch (error) {
        console.error("Error fetching data:", error);
        localStorage.removeItem('adminToken');
        window.location.href = '/admin-login.html';
    }

    document.getElementById('signOutButton').addEventListener('click', () => {
        localStorage.removeItem('adminToken');
        window.location.href = '/admin-login.html';
    });
});

function renderInquiries(inquiries) {
    const container = document.getElementById('inquiriesList');
    container.innerHTML = inquiries.map(inquiry => {
        const mailtoLink = `mailto:${inquiry.email}?subject=Re: ${inquiry.service} Inquiry&body=${generateEmailBody(inquiry)}`;

        return `
            <div class="inquiry-item" data-id="${inquiry.id}">
                <h4>${inquiry.name} - ${inquiry.service}</h4>
                <p>${inquiry.message}</p>
                <p>Status: ${inquiry.status}</p>
                <button class="reply-btn">Reply</button>
            </div>
        `;
    }).join('');

    document.querySelectorAll('.reply-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const inquiryId = e.target.closest('.inquiry-item').dataset.id;
            openReplyModal(inquiryId);
        });
    });
}

function generateEmailBody(inquiry) {
    return `Hi ${inquiry.name},\n\n` +
           `Thank you for contacting Mezani Holdings regarding "${inquiry.service}".\n\n` +
           `Here are the details of your inquiry:\n` +
           `- Name: ${inquiry.name}\n` +
           `- Service: ${inquiry.service}\n` +
           `- Location: ${inquiry.location || "N/A"}\n` +
           `- Additional Information: ${inquiry.message || "N/A"}\n` + // Use inquiry.message directly
           `- Email: ${inquiry.email}\n` +
           `- Phone: ${inquiry.phone || "N/A"}\n\n` +
           `Our Response:\n`; // Leave space for the admin's reply
}

function renderStats(stats) {
    document.getElementById('totalInquiries').textContent = stats.total;
    document.getElementById('answeredInquiries').textContent = stats.answered;
    document.getElementById('pendingInquiries').textContent = stats.pending;
}

let currentInquiryId = null;

async function openReplyModal(inquiryId) {
    const modal = document.getElementById('replyModal');
    currentInquiryId = inquiryId;

    try {
        const response = await fetch(`/api/inquiry/${inquiryId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch inquiry details');
        }

        const inquiry = await response.json();

        const replyMessage = generateEmailBody(inquiry); // Pre-fill with inquiry details

        document.getElementById('replyMessage').value = replyMessage;
        modal.style.display = 'block';
        console.log("currentInquiryId set to:", currentInquiryId);

    } catch (error) {
        console.error("Error in openReplyModal:", error);
        alert("Error fetching inquiry details. Please try again later.");
    }
}

const replyForm = document.getElementById('replyForm');

replyForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const replyText = document.getElementById('replyMessage').value;

    try {
        const adminData = JSON.parse(localStorage.getItem('admin'));
        const adminUsername = adminData ? adminData.username : "admin";

        const fullReply = `
${replyText}

Kind Regards,
Mezani Holdings Sales Team
Email: sales@mezaniholdings.co.za
Replied by: ${adminUsername}
`;

        const response = await fetch('/api/reply', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            },
            body: JSON.stringify({
                inquiryId: currentInquiryId,
                reply: fullReply
            })
        });

        if (!response.ok) {
            throw new Error('Failed to send reply');
        }

        alert('Reply sent successfully!');
        document.getElementById('replyModal').style.display = 'none';
        await reloadData();

    } catch (error) {
        console.error("Error in reply submission:", error);
        alert("Failed to send reply. Please try again later.");
    }
});

document.querySelector('.close').addEventListener('click', () => {
    document.getElementById('replyModal').style.display = 'none';
});

async function reloadData() {
    try {
        const [inquiriesResponse, statsResponse] = await Promise.all([
            fetch('/api/inquiries', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                }
            }),
            fetch('/api/stats', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                }
            })
        ]);

        if (!inquiriesResponse.ok || !statsResponse.ok) throw new Error('Failed to reload data');

        const inquiries = await inquiriesResponse.json();
        const stats = await statsResponse.json();

        renderInquiries(inquiries);
        renderStats(stats);
    } catch (error) {
        console.error("Error:", error);
        alert("Failed to reload data");
    }
}