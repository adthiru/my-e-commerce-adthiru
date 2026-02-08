import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { format } from "date-fns";

import Layout from "@/components/Layout";
import AccountSidebar from "@/components/AccountSidebar";
import Button from "@/components/Button";
import { useAuth } from "@/firebase/context";
import { getOrder, cancelOrder, ORDER_STATUS } from "@/firebase/orders";
import { useAddress } from "hooks/address.hook";

import styles from "./order-detail.module.scss";

const STATUS_STEPS = [
  ORDER_STATUS.CONFIRMED,
  ORDER_STATUS.PROCESSING,
  ORDER_STATUS.SHIPPED,
  ORDER_STATUS.DELIVERED,
];

export default function OrderDetail() {
  const router = useRouter();
  const { id } = router.query;
  const { user, loading: authLoading } = useAuth();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  const address = useAddress(order?.address);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading]);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!id) return;
      try {
        const orderData = await getOrder(id);
        setOrder({
          ...orderData,
          date: orderData.date.toDate(),
          statusHistory: orderData.statusHistory?.map((h) => ({
            ...h,
            date: h.date.toDate(),
          })),
          estimatedDelivery: orderData.estimatedDelivery?.toDate(),
        });
        setLoading(false);
      } catch (err) {
        setError("Order not found");
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  const handleCancelOrder = async () => {
    if (!confirm("Are you sure you want to cancel this order?")) return;
    setCancelling(true);
    try {
      await cancelOrder(id, "Cancelled by customer");
      setOrder((prev) => ({ ...prev, status: ORDER_STATUS.CANCELLED }));
    } catch (err) {
      alert("Failed to cancel order");
    }
    setCancelling(false);
  };

  const getCurrentStep = () => {
    if (order?.status === ORDER_STATUS.CANCELLED) return -1;
    return STATUS_STEPS.indexOf(order?.status);
  };

  if (loading || authLoading) {
    return (
      <Layout noCategories>
        <AccountSidebar />
        <main className={styles.container}>
          <p>Loading...</p>
        </main>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout noCategories>
        <AccountSidebar />
        <main className={styles.container}>
          <p>{error}</p>
          <Button onClick={() => router.push("/account/orders")}>
            Back to Orders
          </Button>
        </main>
      </Layout>
    );
  }

  const currentStep = getCurrentStep();
  const canCancel =
    order?.status === ORDER_STATUS.CONFIRMED ||
    order?.status === ORDER_STATUS.PROCESSING;

  return (
    <Layout noCategories>
      <Head>
        <title>Order #{id}</title>
      </Head>
      <AccountSidebar />
      <main className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1>Order Details</h1>
            <p className={styles.orderId}>Order ID: {id}</p>
            <p className={styles.date}>
              Placed on {format(order.date, "MMMM d, yyyy 'at' h:mm a")}
            </p>
          </div>
          {canCancel && (
            <Button onClick={handleCancelOrder} disabled={cancelling}>
              {cancelling ? "Cancelling..." : "Cancel Order"}
            </Button>
          )}
        </div>

        {order.status === ORDER_STATUS.CANCELLED ? (
          <div className={styles.cancelled}>
            <span>Order Cancelled</span>
          </div>
        ) : (
          <div className={styles.tracker}>
            <h2>Order Status</h2>
            <div className={styles.progressBar}>
              {STATUS_STEPS.map((status, idx) => (
                <div
                  key={status}
                  className={`${styles.step} ${
                    idx <= currentStep ? styles.completed : ""
                  } ${idx === currentStep ? styles.current : ""}`}
                >
                  <div className={styles.dot}>
                    {idx < currentStep ? "✓" : idx + 1}
                  </div>
                  <span>{status}</span>
                </div>
              ))}
            </div>
            {order.trackingNumber && (
              <div className={styles.tracking}>
                <p>
                  Tracking Number: <strong>{order.trackingNumber}</strong>
                </p>
                {order.estimatedDelivery && (
                  <p>
                    Estimated Delivery:{" "}
                    <strong>
                      {format(order.estimatedDelivery, "MMMM d, yyyy")}
                    </strong>
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        <div className={styles.sections}>
          <div className={styles.section}>
            <h3>Items</h3>
            <div className={styles.items}>
              {order.products.map((item, idx) => (
                <div key={idx} className={styles.item}>
                  <div className={styles.itemInfo}>
                    <p className={styles.itemName}>{item.name}</p>
                    <p className={styles.itemMeta}>
                      Size: {item.size} | Qty: {item.quantity}
                    </p>
                  </div>
                  <span className={styles.itemPrice}>
                    ${(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.section}>
            <h3>Shipping Address</h3>
            {!address.loading && address.data && (
              <div className={styles.address}>
                <p>
                  <strong>{address.data.title}</strong>
                </p>
                <p>{address.data.full_address}</p>
                <p>
                  {address.data.city}, {address.data.region}{" "}
                  {address.data.zipcode}
                </p>
              </div>
            )}
          </div>

          <div className={styles.section}>
            <h3>Payment</h3>
            <p>
              {order.paymentMethod?.type?.toUpperCase()} ending in{" "}
              {order.paymentMethod?.last4}
            </p>
          </div>

          <div className={styles.section}>
            <h3>Order Summary</h3>
            <div className={styles.summary}>
              <div className={styles.summaryRow}>
                <span>Subtotal</span>
                <span>
                  ${(order.total_price - (order.shipping_cost || 0)).toFixed(2)}
                </span>
              </div>
              <div className={styles.summaryRow}>
                <span>Shipping</span>
                <span>
                  {order.shipping_cost === 0
                    ? "FREE"
                    : `$${order.shipping_cost?.toFixed(2)}`}
                </span>
              </div>
              <div className={`${styles.summaryRow} ${styles.total}`}>
                <span>Total</span>
                <span>${order.total_price.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {order.statusHistory && order.statusHistory.length > 0 && (
          <div className={styles.history}>
            <h3>Order History</h3>
            <div className={styles.timeline}>
              {order.statusHistory
                .slice()
                .reverse()
                .map((entry, idx) => (
                  <div key={idx} className={styles.timelineItem}>
                    <div className={styles.timelineDot} />
                    <div className={styles.timelineContent}>
                      <strong>{entry.status}</strong>
                      <span>{format(entry.date, "MMM d, yyyy h:mm a")}</span>
                      {entry.note && <p>{entry.note}</p>}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </main>
    </Layout>
  );
}
