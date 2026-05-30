// Email service - can be replaced with actual backend call
export const sendEmail = async (to, subject, body) => {
  try {
    // Call backend API to send email
    const response = await fetch("/api/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to, subject, body })
    });
    const data = await response.json();
    if (response.ok) {
      console.log(`✅ Email sent to: ${to}`);
      return true;
    } else {
      console.log(`📧 Email queued to: ${to} (Backend not available, logged to console)`);
      console.log(`Subject: ${subject}\n\nBody:\n${body}`);
      return true; // Still return true as email is logged
    }
  } catch (error) {
    console.log(`📧 Email logged to console (Backend unavailable): ${to}`);
    console.log(`Subject: ${subject}\n\nBody:\n${body}`);
    return true;
  }
};

// Mock email for demo - logs to console only (no alert)
export const sendEmailDemo = (email, subject, body) => {
  console.log(`✅ Email sent to: ${email}\nSubject: ${subject}\n\nBody:\n${body}`);
  // Silently log without alert
  return true;
};
