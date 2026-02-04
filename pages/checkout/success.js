import React from "react";
import { useRouter } from "next/router";
import Head from "next/head";

import Layout from "@/components/Layout";
import Button from "@/components/Button";

import styles from "./success.module.scss";

export default function OrderSuccess() {
  const router = useRouter();
  const { orderId } = router.query;

  return (
    <Layout noCategories>
      <Head>
        <title>Order Confirmed</title>
      </Head>
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.icon}>✓</div>
          <h1>Order Confirmed!</h1>
          <p>Thank you for your purchase.</p>
          <p className={styles.orderId}>
            Order ID: <strong>{orderId}</strong>
          </p>
          <p className={styles.info}>
            We've sent a confirmation email with your order details.
            You can track your order status in your account.
          </p>
          <div className={styles.actions}>
            <Button onClick={() => router.push(`/account/orders/${orderId}`)}>
              Track Order
            </Button>
            <Button onClick={() => router.push("/")}>
              Continue Shopping
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
