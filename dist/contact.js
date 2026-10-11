const $ = selector => document.querySelector(selector);
let briefText = '';
const dialog = $('#brief-dialog');
$('#brief-form').addEventListener('submit', event => {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.reportValidity()) return;
  const data = new FormData(form);
  const name = data.get('name').trim();
  const email = data.get('email').trim();
  const message = data.get('message').trim();
  if (!name || message.length < 10) {
    const input = !name ? $('#contact-name') : $('#contact-message');
    input.setCustomValidity(!name ? 'Please enter your name.' : 'Please describe your idea in at least 10 characters.');
    input.reportValidity();
    input.addEventListener('input', () => input.setCustomValidity(''), { once: true });
    return;
  }
  briefText = `RoboKing PROJECT BRIEF\n\nName: ${name}\nEmail: ${email}\nField: ${data.get('sector')}\n\nTHE IDEA\n${message}\n\nPrepared with the RoboKing project workbench.`;
  $('#brief-preview').textContent = briefText;
  $('#brief-mailto').href = `mailto:sales@roboking.in?subject=${encodeURIComponent(`Project enquiry: ${data.get('sector')}`)}&body=${encodeURIComponent(briefText)}`;
  $('#copy-status').textContent = '';
  dialog.showModal();
});
$('.dialog-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => { if (event.target === dialog) { const rect = dialog.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close(); } });
$('#brief-copy').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(briefText); $('#copy-status').textContent = 'Brief copied. Ready when you are.'; }
  catch { $('#copy-status').textContent = 'Clipboard unavailable. Use Download .txt to keep your brief.'; }
});
$('#brief-download').addEventListener('click', () => {
  const blob = new Blob([briefText], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url; link.download = 'roboking-project-brief.txt';
  document.body.append(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});
