import { auth, db, firebase } from "../config/firebase";

// Order statuses
export const ORDER_STATUS = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  PROCESSING: "Processing",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

// Create a new order
export const createOrder = async ({
  products,
  address,
  paymentMethod,
  totalPrice,
  shippingCost = 0,
}) => {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error("User not authenticated");

  const orderData = {
    userId: currentUser.uid,
    products,
    address,
    paymentMethod: {
      type: paymentMethod.type,
      last4: paymentMethod.last4,
    },
    total_price: totalPrice,
    shipping_cost: shippingCost,
    status: ORDER_STATUS.CONFIRMED,
    date: firebase.firestore.Timestamp.now(),
    statusHistory: [
      {
        status: ORDER_STATUS.CONFIRMED,
        date: firebase.firestore.Timestamp.now(),
        note: "Order placed successfully",
      },
    ],
    trackingNumber: null,
    estimatedDelivery: null,
  };

  // Create order document
  const orderRef = await db.collection("Orders").add(orderData);

  // Add order ID to user's orders array
  await db
    .collection("Users")
    .doc(currentUser.uid)
    .update({
      orders: firebase.firestore.FieldValue.arrayUnion(orderRef.id),
      cart: {}, // Clear cart after order
    });

  return orderRef.id;
};

// Get single order by ID
export const getOrder = async (orderId) => {
  const doc = await db.collection("Orders").doc(orderId).get();
  if (!doc.exists) throw new Error("Order not found");
  return { id: doc.id, ...doc.data() };
};

// Update order status
export const updateOrderStatus = async (orderId, newStatus, note = "") => {
  const orderRef = db.collection("Orders").doc(orderId);

  await orderRef.update({
    status: newStatus,
    statusHistory: firebase.firestore.FieldValue.arrayUnion({
      status: newStatus,
      date: firebase.firestore.Timestamp.now(),
      note,
    }),
  });
};

// Add tracking number to order
export const addTrackingNumber = async (orderId, trackingNumber, estimatedDelivery) => {
  await db.collection("Orders").doc(orderId).update({
    trackingNumber,
    estimatedDelivery: firebase.firestore.Timestamp.fromDate(new Date(estimatedDelivery)),
  });
};

// Cancel order
export const cancelOrder = async (orderId, reason = "") => {
  await updateOrderStatus(orderId, ORDER_STATUS.CANCELLED, reason);
};
