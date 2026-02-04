import { useState, useEffect } from "react";
import { db, auth } from "@/config/firebase";

// Hook to get cart items with product details for checkout
export const useCheckoutCart = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subtotal, setSubtotal] = useState(0);

  useEffect(() => {
    const fetchCartWithProducts = async () => {
      if (!auth.currentUser) {
        setLoading(false);
        return;
      }

      try {
        const userDoc = await db
          .collection("Users")
          .doc(auth.currentUser.uid)
          .get();
        const cart = userDoc.data()?.cart || {};

        if (Object.keys(cart).length === 0) {
          setItems([]);
          setSubtotal(0);
          setLoading(false);
          return;
        }

        // Get all product IDs from cart
        const productIds = Object.keys(cart);
        const productDocs = await Promise.all(
          productIds.map((id) => db.collection("Products").doc(id).get())
        );

        // Build cart items with product details
        const cartItems = [];
        let total = 0;

        productDocs.forEach((doc) => {
          if (doc.exists) {
            const product = doc.data();
            const sizes = cart[doc.id];

            // Count quantities per size
            const sizeCount = sizes.reduce((acc, size) => {
              acc[size] = (acc[size] || 0) + 1;
              return acc;
            }, {});

            Object.entries(sizeCount).forEach(([size, quantity]) => {
              const itemTotal = product.sale_price * quantity;
              total += itemTotal;
              cartItems.push({
                productId: doc.id,
                name: product.product_name,
                price: product.sale_price,
                size,
                quantity,
                image: product.cover_photo,
                total: itemTotal,
              });
            });
          }
        });

        setItems(cartItems);
        setSubtotal(total);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching checkout cart:", error);
        setLoading(false);
      }
    };

    fetchCartWithProducts();
  }, []);

  return { items, subtotal, loading };
};
