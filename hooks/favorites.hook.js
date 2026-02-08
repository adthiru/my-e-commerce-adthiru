import { useEffect, useState } from "react";
import { auth, db } from "../config/firebase";

const useFavorites = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchFromFirestore() {
      if (!auth.currentUser) {
        setLoading(false);
        return;
      }

      try {
        const userDoc = await db
          .collection("Users")
          .doc(auth.currentUser.uid)
          .get();
        const favorites = userDoc.data()?.favorites || [];

        if (favorites.length === 0) {
          setData([]);
          setLoading(false);
          return;
        }

        const productDocs = await Promise.all(
          favorites.map((id) => db.collection("Products").doc(id).get())
        );

        const products = productDocs
          .filter((doc) => doc.exists)
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

        setData(products);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    }

    fetchFromFirestore();
  }, []);

  return { data, loading, error };
};

export { useFavorites };
