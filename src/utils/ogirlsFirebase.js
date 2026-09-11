import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// 오걸즈(OGIRLS) Firebase 클라이언트 설정
const ogirlsFirebaseConfig = {
    projectId: "ogirls",
    apiKey: "AIzaSyAPDfEexw6PAx9i0GzOcL6S8s5IJbsWdqo",
    authDomain: "ogirls.firebaseapp.com",
    storageBucket: "ogirls.firebasestorage.app",
    messagingSenderId: "671463002821",
    appId: "1:671463002821:web:eb10e35f486209a3e696ac"
};

// 중복 초기화 방지
let ogirlsApp;
if (getApps().some(app => app.name === 'ogirlsApp')) {
    ogirlsApp = getApp('ogirlsApp');
} else {
    ogirlsApp = initializeApp(ogirlsFirebaseConfig, 'ogirlsApp');
}

export const ogirlsDb = getFirestore(ogirlsApp);
export default ogirlsApp;
