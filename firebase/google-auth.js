import { firebase, auth, db } from "../config/firebase";
import { setTokenCookie } from "./cookie";

export default function googleAuth() {
  auth
    .signInWithPopup(new firebase.auth.GoogleAuthProvider())
    .then(async function (result) {
      const token = await result.user.getIdToken();
      setTokenCookie(token);
      db.collection("Users")
        .doc(result.user.uid)
        .get()
        .then((doc) => {
          if (!doc.exists) {
            console.log("Document data:", doc.data());
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
