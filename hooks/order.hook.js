import { useEffect, useState } from "react";
import { auth, db } from "../config/firebase";

const useOrders = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchFromFirestore() {
      auth.currentUser &&
        db
          .collection("Users")
          .doc(auth.currentUser.uid)
          .get()
          .then(function (doc) {
            const orders = doc.data().orders;
            console.log(orders);
            if (orders) {
              db.collection("Orders")
                .get()
                .then(function (querySnapshot) {
                  const ordersArray = querySnapshot.docs
                    .filter((doc) => orders.includes(doc.id))
                    .map(function (doc) {
                      return {
                        id: doc.id,
                        ...doc.data(),
                        date: doc.data().date.toDate(),
                      };
                    });
                  setData(ordersArray);
                  setLoading(false);
                });
            } else {
              setData([]);
              setLoading(false);
            }
          });
    }

    fetchFromFirestore();
  }, [auth.currentUser]);

  return {
    data,
    loading,
    error,
  };
};

const useOrder = (orderId) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }

    async function fetchOrder() {
      try {
        const doc = await db.collection("Orders").doc(orderId).get();
        if (doc.exists) {
          const orderData = doc.data();
          setData({
            id: doc.id,
            ...orderData,
            date: orderData.date?.toDate(),
            statusHistory: orderData.statusHistory?.map((h) => ({
              ...h,
              date: h.date?.toDate(),
            })),
            estimatedDelivery: orderData.estimatedDelivery?.toDate(),
          });
        } else {
          setError("Order not found");
        }
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    }

    fetchOrder();
  }, [orderId]);

  return { data, loading, error };
};

export { useOrders, useOrder };
