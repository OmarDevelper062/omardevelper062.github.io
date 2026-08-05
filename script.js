// ================= المتغيرات العامة للتحقق عبر الرمز (OTP) =================
let generatedOtp = "";
let pendingEmail = "";
let pendingPassword = "";
let pendingName = "";

// ================= نظام التبديل والتحكم في نافذة القفل الإجبارية =================
function switchMandatoryTab(mode) {
    const nameContainer = document.getElementById('mandNameContainer');
    const submitBtn = document.getElementById('mandSubmitBtn');
    const tabLogin = document.getElementById('tabLoginBtn');
    const tabRegister = document.getElementById('tabRegisterBtn');
    const otpContainer = document.getElementById('mandOtpContainer');
    const formElem = document.getElementById('mandatoryAuthForm');

    if (otpContainer) otpContainer.style.display = 'none';
    if (formElem) formElem.style.display = 'block';

    if (mode === 'login') {
        if (nameContainer) nameContainer.style.display = 'none';
        if (submitBtn) {
            submitBtn.textContent = 'تسجيل الدخول';
            submitBtn.setAttribute('data-mode', 'login');
            submitBtn.disabled = false;
        }
        if (tabLogin) { tabLogin.style.background = '#007bff'; tabLogin.style.color = 'white'; }
        if (tabRegister) { tabRegister.style.background = 'transparent'; tabRegister.style.color = '#64748b'; }
    } else {
        if (nameContainer) nameContainer.style.display = 'block';
        if (submitBtn) {
            submitBtn.textContent = 'إرسال رمز التحقق والتسجيل';
            submitBtn.setAttribute('data-mode', 'register');
            submitBtn.disabled = false;
        }
        if (tabRegister) { tabRegister.style.background = '#007bff'; tabRegister.style.color = 'white'; }
        if (tabLogin) { tabLogin.style.background = 'transparent'; tabLogin.style.color = '#64748b'; }
    }
}


// ================= تسجيل الدخول بواسطة جوجل (الإلزامي) =================
window.addEventListener('DOMContentLoaded', () => {
    const googleBtn = document.getElementById('mandGoogleBtn');
    if (googleBtn) {
        googleBtn.addEventListener('click', function() {
            const provider = new firebase.auth.GoogleAuthProvider();
            
            auth.signInWithPopup(provider)
                .then((result) => {
                    const user = result.user;
                    const displayName = user.displayName || user.email.split('@')[0];
                    alert(`أهلاً بك يا بطل (${displayName})! تم تسجيل الدخول بنجاح.`);
                    // مراقب الحالة onAuthStateChanged سيقوم بفتح الموقع تلقائياً
                })
                .catch((error) => {
                    alert('فشل تسجيل الدخول بواسطة جوجل: ' + error.message);
                });
        });
    }
});


// ================= معالجة نموذج التسجيل والدخول الإلزامي بالإيميل (مع نظام الـ OTP) =================
const mandatoryAuthForm = document.getElementById('mandatoryAuthForm');
if (mandatoryAuthForm) {
    mandatoryAuthForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const emailInput = document.getElementById('mandEmail');
        const passwordInput = document.getElementById('mandPassword');
        const nameInput = document.getElementById('mandName');
        
        const email = emailInput ? emailInput.value : '';
        const password = passwordInput ? passwordInput.value : '';
        const name = nameInput ? nameInput.value.trim() : '';
        
        const btn = document.getElementById('mandSubmitBtn');
        const mode = btn ? btn.getAttribute('data-mode') : '';

        if (mode === 'register') {
            if (!email || !password || !name) {
                alert('يرجى ملء جميع الحقول (الاسم، البريد الإلكتروني، وكلمة المرور).');
                return;
            }

            // توليد رمز عشوائي من 6 أرقام
            generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
            pendingEmail = email;
            pendingPassword = password;
            pendingName = name;

            btn.innerText = 'جاري إرسال الرمز لبريدك...';
            btn.disabled = true;

            const serviceID = "service_uh3v9u4";
            const templateID = "template_fkqm8ws";

            const templateParams = {
                to_email: email,          
                otp_code: generatedOtp,
                to_name: name
            };

            if (typeof emailjs === 'undefined') {
                alert('خطأ: لم يتم تحميل مكتبة الإرسال بشكل صحيح.');
                btn.innerText = 'إرسال رمز التحقق والتسجيل';
                btn.disabled = false;
                return;
            }

            // إرسال الإيميل عبر EmailJS
            emailjs.send(serviceID, templateID, templateParams)
                .then((response) => {
                    console.log('SUCCESS!', response.status, response.text);
                    alert('تم إرسال رمز التحقق بنجاح إلى بريدك الإلكتروني! تحقق من صندوق الوارد (أو البريد العشوائي Spam).');
                    
                    const formElem = document.getElementById('mandatoryAuthForm');
                    const otpElem = document.getElementById('mandOtpContainer');
                    if (formElem) formElem.style.display = 'none';
                    if (otpElem) otpElem.style.display = 'block';
                    
                    btn.innerText = 'إرسال رمز التحقق والتسجيل';
                    btn.disabled = false;
                })
                .catch((error) => {
                    console.error('FAILED...', error);
                    alert('فشل إرسال البريد الإلكتروني. الخطأ: ' + (error.text || JSON.stringify(error)));
                    btn.innerText = 'إرسال رمز التحقق والتسجيل';
                    btn.disabled = false;
                });

        } else {
            // تسجيل الدخول العادي
            auth.signInWithEmailAndPassword(email, password)
                .then((userCredential) => {
                    const user = userCredential.user;
                    const displayName = user.displayName || user.email.split('@')[0];
                    alert(`مرحباً بك يا ${displayName}! تم تسجيل الدخول بنجاح.`);
                })
                .catch((error) => {
                    alert('البريد الإلكتروني أو كلمة المرور غير صحيحة: ' + error.message);
                });
        }
    });
}


// ================= زر التحقق من الرمز المدخل (OTP) في النافذة الإلزامية =================
const mandVerifyOtpBtn = document.getElementById('mandVerifyOtpBtn');
if (mandVerifyOtpBtn) {
    mandVerifyOtpBtn.addEventListener('click', function() {
        const userEnteredOtp = document.getElementById('mandOtpCode').value.trim();

        if (userEnteredOtp === generatedOtp) {
            // الرمز صحيح! إنشاء الحساب في Firebase
            auth.createUserWithEmailAndPassword(pendingEmail, pendingPassword)
                .then((userCredential) => {
                    const user = userCredential.user;
                    
                    // حفظ الاسم في ملف تعريف المستخدم بـ Firebase
                    user.updateProfile({
                        displayName: pendingName
                    }).then(() => {
                        alert(`تم تأكيد الحساب وإنشاؤه بنجاح يا ${pendingName}! أهلاً بك.`);
                    });
                })
                .catch((error) => {
                    alert('خطأ أثناء حفظ الحساب: ' + error.message);
                });
        } else {
            alert('رمز التحقق غير صحيح، يرجى المحاولة مرة أخرى.');
        }
    });
}


// ================= مراقبة حالة الجلسة وإلغاء قفل الموقع عند الدخول =================
auth.onAuthStateChanged((user) => {
    if (user) {
        // المستخدم مسجل: إزالة القفل وعرض الموقع
        document.body.classList.remove('locked-body');
        document.body.classList.add('logged-in');
        const modal = document.getElementById('mandatoryAuthModal');
        if (modal) modal.style.display = 'none';
    } else {
        // المستخدم غير مسجل: تفعيل القفل وعرض نافذة الدخول الإلزامية
        document.body.classList.add('locked-body');
        document.body.classList.remove('logged-in');
        const modal = document.getElementById('mandatoryAuthModal');
        if (modal) modal.style.display = 'flex';
    }
});


// زر تسجيل الخروج
function logoutUser() {
    auth.signOut().then(() => {
        location.reload();
    });
}

// للتخطي المؤقت للتجربة المحلية
function bypassLoginForTesting() {
    document.body.classList.remove('locked-body');
    document.body.classList.add('logged-in');
    const modal = document.getElementById('mandatoryAuthModal');
    if (modal) modal.style.display = 'none';
}


// ================= زر الدورة الشاملة والاتصالات عبر الواتساب =================
const subscribeBtn = document.getElementById('subscribeBtn');
if (subscribeBtn) {
    subscribeBtn.addEventListener('click', function(e) {
        e.preventDefault();
        const phoneNumber = "97450137538"; 
        const text = "مرحباً يا استاذ عمر، أرغب في الاشتراك في الدورة الشاملة للفصل الأول (120 ريال قطري).";
        const encodedURL = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(text)}`;
        window.open(encodedURL, '_blank');
    });
}


// نموذج الاستشارة وطلب المساعدة
const consultForm = document.getElementById('consultForm');
if (consultForm) {
    consultForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const name = document.getElementById('name').value;
        const phone = document.getElementById('phone').value;
        const phoneNumber = "97450137538"; 
        const text = `مرحباً يا استاذ عمر، أنا الطالب/ـة ${name}، وهذا رقم هاتفي: ${phone}. أريد استشارة أو مساعدة في سؤال.`;
        const encodedURL = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(text)}`;
        window.open(encodedURL, '_blank');
    });
}