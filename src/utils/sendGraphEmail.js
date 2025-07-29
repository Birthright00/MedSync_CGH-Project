export const sendEmailViaGraph = async ({
    selectedDoctors,
    doctors,
    subject,
    body,
    accessToken,
    sessionId,
}) => {
    if (!subject || !body || selectedDoctors.length === 0) {
        alert("⚠️ Subject, body, or recipients are missing.");
        return;
    }

    const selectedDoctorObjs = doctors.filter((doc) =>
        selectedDoctors.includes(doc.mcr_number)
    );

    const toEmails = selectedDoctorObjs.map((doc) => ({
        emailAddress: { address: doc.email },
    }));

    const payload = {
        message: {
            subject,
            body: {
                contentType: "Text",
                content: body,
            },
            toRecipients: toEmails,
            internetMessageHeaders: [
                {
                    name: "X-Session-ID",
                    value: sessionId,
                }
            ]
        },
    };

    try {
        const response = await fetch("https://graph.microsoft.com/v1.0/me/sendMail", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });

        if (response.ok) {
            alert("✅ Email sent successfully!");
        } else {
            const error = await response.json();
            console.error("❌ Email send failed:", error);
            alert(`❌ Failed to send email: ${error.error?.message}`);
        }
    } catch (err) {
        console.error("❌ Exception occurred:", err);
        alert("❌ An error occurred while sending the email.");
    }
};
