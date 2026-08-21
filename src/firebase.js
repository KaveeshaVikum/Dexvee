import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  projectId: "dexvee-cbbf5",
  apiKey: import.meta.env.AIzaSyAyASp-U0DjLuWw01Hed5Ier_rmiWBxvRw,
  authDomain: "dexvee-cbbf5.firebaseapp.com",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);