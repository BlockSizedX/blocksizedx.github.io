document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const templateId = urlParams.get('template');
    const template = templates.find(t => t.id === templateId) || templates[0]; // fallback first

    // Populate template info
    document.getElementById('template-name').textContent = template.name;
    document.getElementById('template-preview').src = template.image;
    document.getElementById('template-description').textContent = template.description;
    document.getElementById('template-price').textContent = template.price === 0 ? "FREE" : `₹${template.price}`;

    const featuresContainer = document.getElementById('template-features');
    featuresContainer.innerHTML = '';
    template.features.forEach(f => {
        const span = document.createElement('span');
        span.textContent = f;
        featuresContainer.appendChild(span);
    });

    // Hide "free download" option if template is paid
    const paymentSelect = document.getElementById('payment-method');
    if(template.price > 0) {
        const freeOption = paymentSelect.querySelector('option[value="free"]');
        if(freeOption) freeOption.style.display = 'none';
        paymentSelect.value = 'upi'; // default to UPI for paid templates
    } else {
        paymentSelect.value = 'free'; // default free for free templates
    }

    // Payment button logic
    const payBtn = document.getElementById('pay-btn');
    payBtn.addEventListener('click', function() {
        const name = document.getElementById('customer-name').value;
        const email = document.getElementById('customer-email').value;

        if(template.price === 0) {
            freeDownload();
            return;
        }

        // Paid template
        if(!name || !email) { 
            alert("Fill required fields"); 
            return; 
        }

        initiateUPIPayment(name, email);
    });

    // Verification logic
    document.getElementById('verify-btn').addEventListener('click', function() {
        const transactionId = document.getElementById('transaction-id').value;
        if(!transactionId) { alert("Enter transaction ID"); return; }
        verifyPayment(transactionId);
    });

    function freeDownload() {
        document.getElementById('download-link').href = template.download;
        document.getElementById('success-message').classList.add('active');
        document.getElementById('success-message').scrollIntoView({behavior:"smooth", block:"center"});
        console.log("Free download:", template.name);
    }

    function initiateUPIPayment(name, email) {
        const orderId = 'BSX'+Date.now()+Math.floor(Math.random()*1000);
        const upiId = 'raseena3131@okhdfcbank';
        const upiUrl = `upi://pay?pa=${upiId}&pn=BlockSizedX&am=${template.price}&tid=${orderId}&tn=Payment for ${template.name}&cu=INR`;
        window.location.href = upiUrl;

        setTimeout(() => {
            document.querySelector('.payment-form').style.display='none';
            document.getElementById('verification-section').classList.add('active');
            console.log("Payment started:", orderId);
        }, 2000);
    }

    function verifyPayment(transactionId) {
        const verifyBtn = document.getElementById('verify-btn');
        verifyBtn.innerHTML='<i class="fas fa-spinner fa-spin"></i> Verifying...';
        verifyBtn.disabled=true;

        setTimeout(()=>{
            document.getElementById('verification-section').classList.remove('active');
            document.getElementById('success-message').classList.add('active');
            document.getElementById('download-link').href = template.download;
            verifyBtn.innerHTML='<i class="fas fa-check-circle"></i> Verify & Download';
            verifyBtn.disabled=false;
            console.log("Payment verified:", transactionId);
        },2000);
    }
});
