import { firebase, auth, db } from "../config/firebase";

export default function googleAuth() {
  auth
    .signInWithPopup(new firebase.auth.GoogleAuthProvider())
    .then(async function (result) {
      const idToken = await result.user.getIdToken();
      await fetch("/api/session-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });
      db.collection("Users")
        .doc(result.user.uid)
        .get()
        .then((doc) => {
          if (!doc.exists) {
            db.collection("Users").doc(result.user.uid).set({
              email: result.additionalUserInfo.profile.email,
              name: result.additionalUserInfo.profile.given_name,
              surname: result.additionalUserInfo.profile.family_name,
              addresses: [],
              cart: {},
              favorites: [],
              orders: [],
              phoneNumber: "",
              photoUrl: null,
            });
          }
        });
    })
    .catch(function (error) {
      console.log(error);
    });
}
