document.addEventListener("DOMContentLoaded", function () {
	// Use buttons to toggle between views
	document
		.querySelector("#inbox")
		.addEventListener("click", () => load_mailbox("inbox"));
	document
		.querySelector("#sent")
		.addEventListener("click", () => load_mailbox("sent"));
	document
		.querySelector("#archived")
		.addEventListener("click", () => load_mailbox("archive"));
	document.querySelector("#compose").addEventListener("click", compose_email);
	document
		.querySelector("#compose-form")
		.addEventListener("submit", compose_email_submit);
	// By default, load the inbox
	load_mailbox("inbox");
});

function compose_email(recipients = "", subject = "", body = "") {
  // Show compose view and hide other views
  document.querySelector("#emails-view").style.display = "none";
  document.querySelector("#email-view").style.display = "none";
  document.querySelector("#compose-view").style.display = "block";

  // Fill in composition fields
  document.querySelector("#compose-recipients").value = recipients;
  document.querySelector("#compose-subject").value = subject;
  document.querySelector("#compose-body").value = body;
}

function viewEmail(e) {
  document.querySelector("#emails-view").style.display = "none";
  document.querySelector("#email-view").style.display = "block";
  document.querySelector("#compose-view").style.display = "none";

  const id = e.currentTarget.dataset.id;
  const mailbox = e.currentTarget.dataset.mailbox;
  const sender = 
  fetch(`/emails/${id}`)
    .then(response => response.json())
    .then(email => {
      const click_email_html = `
        <h4>From: ${email.sender}</h4>
        <h4>Subject: ${email.subject}</h4>
        <h4>Timestamp: ${email.timestamp}</h4>
        ${mailbox !== "sent"
          ? `<button id="archive-btn">${!email.archived ? "Archive" : "Unarchive"}</button>`
          : ""}
        <button id="reply-btn">Reply</button>
        <hr>
        <p>${email.body}</p>
      `;

      const email_view = document.querySelector("#email-view");
      email_view.innerHTML = click_email_html;

      // Attach archive button event listener if present
      const archiveBtn = document.querySelector("#archive-btn");
      if (archiveBtn) {
        archiveBtn.addEventListener("click", () => {
          fetch(`/emails/${id}`, {
            method: "PUT",
            body: JSON.stringify({
              archived: !email.archived
            })
          }).then(() => load_mailbox("inbox"));
        });
      }
      const replyBtn = document.querySelector("#reply-btn");
      replyBtn.addEventListener('click',()=>{
          const replySubject = email.subject.startsWith("Re:") ? email.subject : `Re: ${email.subject}`;
          const replyBody = `\n\nOn ${email.timestamp}, ${email.sender} wrote:\n\t${email.body}`;
          compose_email(recipients = email.sender, subject = replySubject, body = replyBody)
      })
    });

  // Mark as read
  fetch(`/emails/${id}`, {
    method: "PUT",
    body: JSON.stringify({
      read: true
    })
  });
}


function load_mailbox(mailbox) {
	// Show the mailbox and hide other views
	document.querySelector("#emails-view").style.display = "block";
	document.querySelector("#email-view").style.display = "none";
	document.querySelector("#compose-view").style.display = "none";

	// Show the mailbox name
	document.querySelector("#emails-view").innerHTML = `<h3>${
		mailbox.charAt(0).toUpperCase() + mailbox.slice(1)
	}</h3>`;

	fetch(`/emails/${mailbox}`)
		.then((response) => response.json())
		.then((emails) => {
			// Print emails
			console.log(emails);
			if (emails.length != 0) {
				emails.forEach((email) => {
					const email_html = document.createElement("div");
					email_html.dataset.id = email.id;
					email_html.dataset.mailbox = mailbox;
					email_html.innerHTML = `
        <div class="email-card ${email.read ? "read" : "unread"}">
        <span class="email-card-body">
        <span>From: ${email.sender}</span>
        <span>Subject: ${email.subject}</span>
        </span>
        <span class="email-card-timestamp">Time: ${email.timestamp}</span>
        </div>
        `;
					email_html.addEventListener("click", viewEmail);
					document.querySelector("#emails-view").append(email_html);
				});
			} else {
				const email_html = document.createElement("div");
				email_html.innerHTML = `
        <h3>empty</h3>
        `;

				document.querySelector("#emails-view").append(email_html);
			}

			// ... do something else with emails ...
		});
}

function compose_email_submit(e) {
	e.preventDefault();
	//Fields Values
	recipients = document.querySelector("#compose-recipients").value;
	subject = document.querySelector("#compose-subject").value;
	body = document.querySelector("#compose-body").value;

	fetch("/emails", {
		method: "POST",
		body: JSON.stringify({
			recipients: recipients,
			subject: subject,
			body: body,
		}),
	})
		.then((response) => response.json())
		.then((result) => {
			// Print result
			console.log(result);
		});

	//loading user's sent mailbox
	load_mailbox("sent");
}
