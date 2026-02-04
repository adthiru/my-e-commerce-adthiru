import { db, auth } from "@/config/firebase";
import { useState, useEffect } from "react";

const useCart = (id) => {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let unsubscribe;

    async function fetchFromFirestore() {
      if (auth.currentUser) {
        unsubscribe = db
          .collection("Users")
          .doc(auth.currentUser.uid)
          .onSnapshot(function (doc) {
            const cartData = doc.data()?.cart;
            setData(cartData || {});
            setLoading(false);
          }, (err) => {
            setError(err);
            setLoading(false);
          });
      } else {
        setLoading(false);
      }
    }

    fetchFromFirestore();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  return {
    data,
    loading,
    error,
  };
};

const useCartOnce = (id) => {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchFromFirestore() {
      if (auth.currentUser?.uid) {
        db.collection("Users")
          .doc(auth.currentUser.uid)
          .get()
          .then(function (doc) {
            setData(doc.data()?.cart || {});
            setLoading(false);
          })
          .catch((e) => {
            setError(e);
            setLoading(false);
          });
      } else {
        setLoading(false);
      }
    }

    fetchFromFirestore();
  }, []);

  return {
    data,
    loading,
    error,
  };
};

export { useCart, useCartOnce };
