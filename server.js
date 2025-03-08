require('dotenv').config();
const express = require('express');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const geoip = require('geoip-lite'); // Moved to the top for better organization

const app = express();
const PORT = process.env.PORT || 3500;

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'https://yciodlqdaeqriivvyysf.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljaW9kbHFkYWVxcmlpdnZ5eXNmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAxNzc5MjUsImV4cCI6MjA1NTc1MzkyNX0.3JcqkigXo2RgvW5iMI2q0oOYaH_YB8b-tQVVaAg5v6U';
const supabase = createClient(supabaseUrl, supabaseKey);

// Test Supabase connection
async function testSupabaseConnection() {
    try {
        const { data, error } = await supabase.from('admins').select('id').limit(1);
        if (error) {
            console.error('Supabase Connection Test Error:', error);
        } else {
            console.log('Supabase Connection Test Success:', data);
        }
    } catch (error) {
        console.error('Supabase Connection Test Exception:', error);
    }
}

testSupabaseConnection();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
});
app.use(limiter);

// Email transporters
const serverTransporter = nodemailer.createTransport({
    host: 'mail.mezaniholdings.co.za',
    port: 587,
    secure: false, // Use TLS
    auth: {
        user: process.env.EMAIL_USER, // Server email
        pass: process.env.EMAIL_PASS, // Server email password
    },
});

const contactFormTransporter = nodemailer.createTransport({
    host: 'mail.mezaniholdings.co.za',
    port: 587,
    secure: false, // Use TLS
    auth: {
        user: 'fromwebsite@mezaniholdings.co.za', // Contact form email
        pass: 'MEwAysCmCh92mqNnHurq', // Contact form email password
    },
});

// JWT Authentication Middleware
const authenticateJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (authHeader) {
        const token = authHeader.split(' ')[1];

        jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
            if (err) return res.sendStatus(403);
            req.user = user;
            next();
        });
    } else {
        res.sendStatus(401);
    }
};

// Keep-alive mechanism
const keepAlive = () => {
    setInterval(async () => {
        try {
            const response = await fetch(`http://localhost:${PORT}/api/keep-alive`);
            console.log('Keep-alive request sent:', response.status);
        } catch (error) {
            console.error('Keep-alive request failed:', error);
        }
    }, 600000); // 10 minutes
};

app.get('/api/keep-alive', (req, res) => {
    res.status(200).json({ message: 'Server is alive' });
});

keepAlive();

// Log login attempts
const logLoginAttempt = async (username, ip, success) => {
    try {
        const { data, error } = await supabase
            .from('login_attempts')
            .insert([{ username, ip, success, timestamp: new Date().toISOString() }])
            .select();

        if (error) throw error;
        console.log('Login attempt logged:', data);
    } catch (error) {
        console.error('Error logging login attempt:', error);
    }
};

// Admin login route
app.post('/api/admin/login', async (req, res) => {
    console.log('Login route hit'); // Debugging log
    const { username, password } = req.body;
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const geo = geoip.lookup(ip);

    try {
        console.log('Login Request:', { username, ip });

        const { data: admin, error } = await supabase
            .from('admins')
            .select('*')
            .eq('username', username)
            .single();

        if (error || !admin) {
            console.error('Admin not found or query error:', error);
            await logLoginAttempt(username, ip, false);
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const passwordMatch = await bcrypt.compare(password, admin.password);
        if (!passwordMatch) {
            console.error('Password mismatch');
            await logLoginAttempt(username, ip, false);
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign({ userId: admin.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        console.log('Token Generated:', token);

        // Send email notification
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: process.env.ADMIN_EMAIL,
            subject: 'New Login Detected',
            text: `New login from ${username} at ${new Date().toISOString()} from IP: ${ip}, Location: ${geo ? `${geo.city}, ${geo.country}` : 'Unknown'}`,
        };

        await serverTransporter.sendMail(mailOptions);
        console.log('Login notification email sent');

        await logLoginAttempt(username, ip, true);
        res.json({ token });

    } catch (error) {
        console.error('Login Route Error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Route to handle contact form submission
app.post('/send-email', (req, res) => {
    const { name, email, message } = req.body;

    const mailOptions = {
        from: 'fromwebsite@mezaniholdings.co.za',
        to: 'langenjustice@gmail.com',
        subject: 'New Contact Form Submission',
        text: `Name: ${name}\nEmail: ${email}\nMessage: ${message}`,
    };

    contactFormTransporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error sending email:', error);
            return res.status(500).json({ error: 'Error sending email' });
        }
        console.log('Email sent:', info.response);
        res.status(200).json({ message: 'Email sent successfully' });
    });
});

// Route to handle inquiry submission
app.post('/api/inquiry', async (req, res) => {
    try {
        const { name, email, phone, service, message, location } = req.body;

        // Log incoming request data
        console.log('Incoming Inquiry Data:', { name, email, phone, service, message, location });

        // Insert inquiry into Supabase
        const { data, error } = await supabase
            .from('inquiries')
            .insert([{ name, email, phone, service, message, location, status: 'pending' }])
            .select();

        if (error) {
            console.error('Supabase Insert Error:', error); // Log Supabase error
            throw error;
        }

        console.log('Inquiry Inserted:', data); // Log successful insertion

        // Send email to admin
        await serverTransporter.sendMail({
            from: process.env.EMAIL_USER,
            to: process.env.ADMIN_EMAIL,
            subject: 'New Inquiry Received',
            text: `New inquiry from ${name} (${email}) at ${location}`,
        });

        console.log('Email sent to admin'); // Log email success

        res.status(201).json(data[0]);

    } catch (error) {
        console.error('Error in /api/inquiry:', error); // Log server error
        res.status(400).json({ error: error.message });
    }
});

// Route to handle inquiry reply
app.post('/api/reply', authenticateJWT, async (req, res) => {
    try {
        const { inquiryId, reply } = req.body;

        // Update inquiry in Supabase
        const { data, error } = await supabase
            .from('inquiries')
            .update({ status: 'answered', reply })
            .eq('id', inquiryId)
            .select();

        if (error) throw error;

        // Send reply email to the inquirer
        await serverTransporter.sendMail({
            from: `Mezani Holdings <${process.env.EMAIL_USER}>`,
            to: data[0].email,
            subject: 'Reply to your Inquiry',
            text: reply,
        });

        res.json({ message: 'Reply sent and saved successfully' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: error.message || 'Failed to process reply' });
    }
});

// Route to fetch a single inquiry
app.get('/api/inquiry/:id', authenticateJWT, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('inquiries')
            .select('*')
            .eq('id', req.params.id)
            .single();

        if (error) throw error;
        if (!data) return res.status(404).json({ error: 'Inquiry not found' });

        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Route to fetch statistics
app.get('/api/stats', authenticateJWT, async (req, res) => {
    try {
        const { count: total } = await supabase
            .from('inquiries')
            .select('*', { count: 'exact', head: true });

        const { count: pending } = await supabase
            .from('inquiries')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'pending');

        const { count: answered } = await supabase
            .from('inquiries')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'answered');

        res.json({ total, pending, answered });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Route to fetch all inquiries
app.get('/api/inquiries', authenticateJWT, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('inquiries')
            .select('*');

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Serve frontend
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});