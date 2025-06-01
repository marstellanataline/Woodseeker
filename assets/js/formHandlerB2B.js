document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('b2bForm');
  const templateId = form.getAttribute('data-template-id');

  if (!templateId) {
    console.error('Template ID is missing in the form.');
    return;
  }
  form.addEventListener('submit', async function (event) {
    event.preventDefault();

    if (!form.checkValidity()) {
      alert('Please fill in all required fields.');
      return;
    }
    const formData = {
      company: form.company.value.trim(),
      name: form.name.value.trim(),
      email: form.email.value.trim(),
      phone: form.phone.value.trim(),
      website: form.website.value.trim(),
      businessType: form['business-type'].value,
      message: form.message.value.trim(),
    };
    try {
      await emailjs.send('service_a862l6m', templateId, formData);
      document.getElementById('formMessage').style.display = 'block';
      document.getElementById('errorMessage').style.display = 'none';
      form.reset();
    } catch (error) {
      console.error('Error sending email:', error);
      document.getElementById('errorMessage').style.display = 'block';
      document.getElementById('formMessage').style.display = 'none';
    }
  });
});
