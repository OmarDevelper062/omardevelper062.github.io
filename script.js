// ================= المتغيرات العامة للتحقق عبر الرمز (OTP) =================
let generatedOtp = "";
let pendingEmail = "";
let pendingPassword = "";
let pendingName = "";

// ================= نظام فتح وإغلاق نافذة الحسابات =================
function openAuthModal(mode) {
    const modal = document.getElementById('authModal');
    const title = document.getElementById('modalTitle');
    const btn = document.getElementById('authSubmitBtn');
    const nameFieldContainer = document.getElementById('authNameContainer');
    
    if (modal) {
        modal.style.display = 'flex';
        
        // إعادة ضبط النافذة دائماً للحالة الافتراضية عند فتحها
        const authForm = document.getElementById('authForm');
        const otpContainer = document.getElementById('otpModalContainer');
        if (authForm) {
            authForm.style.display = 'block';
            authForm.reset();
        }
        if (otpContainer) otpContainer.style.display = 'none';

        if (mode === 'login') {
            title.innerText = 'تسجيل دخول الطلاب';
            btn.innerText = 'دخول';
            btn.setAttribute('data-mode', 'login');
            if (nameFieldContainer) nameFieldContainer.style.display = 'none'; // إخفاء حقل الاسم عند تسجيل الدخول
        } else {
            title.innerText = 'تسجيل حساب طالب جديد';
            btn.innerText = 'إنشاء الحساب (إرسال الرمز)';
            btn.setAttribute('data-mode', 'register');
            if (nameFieldContainer) nameFieldContainer.style.display = 'block'; // إظهار حقل الاسم عند التسجيل الجديد
        }
    }
}

function closeAuthModal() {
    const modal = document.getElementById('authModal');
    if (modal) {
        modal.style.display = 'none';
        const authForm = document.getElementById('authForm');
        const otpContainer = document.getElementById('otpModalContainer');
        if (authForm) {
            authForm.style.display = 'block';
            authForm.reset();
        }
        if (otpContainer) otpContainer.style.display = 'none';
    }
}

window.onclick = function(event) {
    const modal = document.getElementById('authModal');
    if (event.target === modal) {
        closeAuthModal();
    }
}


// ================= تسجيل الدخول بواسطة جوجل =================
window.addEventListener('DOMContentLoaded', () => {
    const googleBtn = document.getElementById('googleSignInBtn');
    if (googleBtn) {
        googleBtn.addEventListener('click', function() {
            const provider = new firebase.auth.GoogleAuthProvider();
            
            auth.signInWithPopup(provider)
                .then((result) => {
                    const user = result.user;
                    alert(`أهلاً بك يا بطل (${user.displayName || user.email})! تم تسجيل الدخول بنجاح.`);
                    closeAuthModal();
                    updateStudentUI(user.displayName || user.email.split('@')[0]);
                })
                .catch((error) => {
                    alert('فشل تسجيل الدخول بواسطة جوجل: ' + error.message);
                });
        });
    }
});


// ================= معالجة نموذج التسجيل والدخول بالإيميل (مع نظام الـ OTP) =================
const authForm = document.getElementById('authForm');
if (authForm) {
    authForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const emailInput = document.getElementById('authEmail');
        const passwordInput = document.getElementById('authPassword');
        const nameInput = document.getElementById('authName');
        
        const email = emailInput ? emailInput.value : '';
        const password = passwordInput ? passwordInput.value : '';
        const name = nameInput ? nameInput.value.trim() : '';
        
        const btn = document.getElementById('authSubmitBtn');
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

            // إظهار حالة جاري الإرسال على الزر وتنزيل تفعيله مؤقتاً
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
                alert('خطأ: لم يتم تحميل مكتبة الإرسال بشكل صحيح في صفحة HTML.');
                btn.innerText = 'إنشاء الحساب (إرسال الرمز)';
                btn.disabled = false;
                return;
            }

            // إرسال الإيميل عبر EmailJS
            emailjs.send(serviceID, templateID, templateParams)
                .then((response) => {
                    console.log('SUCCESS!', response.status, response.text);
                    alert('تم إرسال رمز التحقق بنجاح إلى بريدك الإلكتروني! تحقق من صندوق الوارد (أو البريد العشوائي Spam).');
                    
                    const formElem = document.getElementById('authForm');
                    const otpElem = document.getElementById('otpModalContainer');
                    if (formElem) formElem.style.display = 'none';
                    if (otpElem) otpElem.style.display = 'block';
                    
                    btn.innerText = 'إنشاء الحساب (إرسال الرمز)';
                    btn.disabled = false;
                })
                .catch((error) => {
                    console.error('FAILED...', error);
                    alert('فشل إرسال البريد الإلكتروني. الخطأ: ' + (error.text || JSON.stringify(error)));
                    btn.innerText = 'إنشاء الحساب (إرسال الرمز)';
                    btn.disabled = false;
                });

        } else {
            // تسجيل الدخول العادي
            auth.signInWithEmailAndPassword(email, password)
                .then((userCredential) => {
                    const user = userCredential.user;
                    const displayName = user.displayName || user.email.split('@')[0];
                    alert(`مرحباً بك يا ${displayName}! تم تسجيل الدخول بنجاح.`);
                    closeAuthModal();
                    updateStudentUI(displayName);
                })
                .catch((error) => {
                    alert('البريد الإلكتروني أو كلمة المرور غير صحيحة: ' + error.message);
                });
        }
    });
}


// ================= زر التحقق من الرمز المدخل (OTP) =================
const verifyOtpBtn = document.getElementById('verifyOtpBtn');
if (verifyOtpBtn) {
    verifyOtpBtn.addEventListener('click', function() {
        const userEnteredOtp = document.getElementById('otpInputCode').value.trim();

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
                        closeAuthModal();
                        updateStudentUI(pendingName);
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


// ================= تحديث واجهة الموقع باسم الطالب =================
function updateStudentUI(displayName) {
    const authActions = document.querySelector('.auth-actions');
    if (authActions) {
        authActions.innerHTML = `
            <span style="font-size: 0.95rem; font-weight: bold; color: #007bff; max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${displayName}">🎓 أهلاً، ${displayName}</span>
            <button type="button" onclick="studentLogout()" style="padding: 6px 12px; background: #dc3545; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 0.85rem; font-weight: bold;">خروج</button>
        `;
    }
}


// مراقبة حالة الجلسة
auth.onAuthStateChanged((user) => {
    if (user) {
        const displayName = user.displayName || user.email.split('@')[0];
        updateStudentUI(displayName);
    }
});


// تسجيل الخروج
function studentLogout() {
    auth.signOut().then(() => {
        location.reload();
    });
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