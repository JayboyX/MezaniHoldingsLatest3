document.getElementById('quoteForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const form = document.getElementById('quoteForm');

    // Client-Side Validation
    if (!form.checkValidity()) {
        form.classList.add('was-validated');
        console.log('Form validation failed'); // Log validation failure
        return;
    }

    form.classList.remove('was-validated');
    form.reset();

    const formData = new FormData(form);

    // Log form data for debugging
    for (let [key, value] of formData.entries()) {
        console.log(`${key}: ${value}`);
    }

    try {
        const response = await fetch('/api/inquiry', {
            method: 'POST',
            body: formData
        });

        console.log('Response Status:', response.status); // Log response status

        if (!response.ok) {
            const errorData = await response.json();
            const errorMessage = errorData.error || errorData.message || 'Error submitting inquiry.';
            console.error('Server Error:', errorMessage); // Log server error
            throw new Error(errorMessage);
        }

        const data = await response.json();
        console.log('Inquiry submitted successfully:', data); // Log success

        alert('Your inquiry has been submitted successfully!');

    } catch (error) {
        console.error('Error submitting inquiry:', error); // Log client-side error
        alert('An error occurred: ' + error.message);
    }
});

