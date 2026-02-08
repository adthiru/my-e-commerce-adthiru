import Head from "next/head";
import styles from "./cart.module.scss";

import Layout from "components/Layout";
import CartItem from "@/components/CartItem";
import Button from "@/components/Button";
import { useCart } from "hooks/cart.hook";
import React from "react";
import { useAuth } from "@/firebase/context";
import { addToCart } from "@/firebase/product";
import { useRouter } from "next/router";

export default function CartPage() {
  const { user, loading } = useAuth();
  const { data } = useCart();
  const router = useRouter();

  const cartLength = data ? Object.keys(data).reduce((a, b) => a + data[b].length, 0) : 0;

  const cartItems =
    cartLength > 0
      ? Object.keys(data)
          .map((item) => {
            return data[item].map((size) => {
              return {
                name: item,
                size,
              };
            });
          })
          .flat(1)
      : [];

  const sizeCount = cartItems.reduce(
    (acc, value) => ({
      ...acc,
      [value.name + "__size__" + value.size]:
        (acc[value.name + "__size__" + value.size] || 0) + 1,
    }),
    {}
  );

  const cartItemsArray = [
    ...new Set(
      cartItems.filter(
        (v, i, a) =>
          a.findIndex((t) => t.name === v.name && t.size === v.size) === i
      )
    ),
  ].map((item) => {
    return { ...item, count: sizeCount[item.name + "__size__" + item.size] };
  });

  const addCartEvent = (id, size) => {
    const currentCart = data || {};
    const newCart = size
      ? {
          ...currentCart,
          [id]: currentCart.hasOwnProperty(id) ? [...currentCart[id], size] : [size],
        }
      : {
          ...currentCart,
          [id]: currentCart.hasOwnProperty(id) ? [...currentCart[id], "-"] : ["-"],
        };
    addToCart(newCart);
  };

  const removeCartEvent = (id, size) => {
    if (!data || !data[id]) return;

    const sizes = [...data[id]];
    const sizeToRemove = size || "-";
    const indexToRemove = sizes.indexOf(sizeToRemove);

    if (indexToRemove > -1) {
      sizes.splice(indexToRemove, 1);
      const newCart = sizes.length > 0
        ? { ...data, [id]: sizes }
        : Object.fromEntries(Object.entries(data).filter(([key]) => key !== id));
      addToCart(newCart);
    }
  };

  if (!loading && !user && typeof window !== "undefined") router.push("/login");

  return (
    <Layout>
      <div className={styles.container}>
        <Head>
          <title>My Cart</title>
          <link rel="icon" href="/favicon.ico" />
        </Head>

        <main className={styles.main}>
          <div className={styles.header}>
            <h1 className={styles.title}>My Cart</h1>
            <h4>You have {cartLength} items in your cart</h4>
          </div>
          {cartItemsArray.length === 0 ? (
            <div className={styles.emptyCart}>
              <p>Your cart is empty</p>
              <Button onClick={() => router.push("/")}>Continue Shopping</Button>
            </div>
          ) : (
            <>
              {cartItemsArray.map((item, index) => {
                return (
                  <CartItem
                    key={index}
                    id={item.name}
                    size={item.size}
                    count={item.count}
                    onAdd={addCartEvent}
                    onRemove={removeCartEvent}
                  />
                );
              })}
              <div className={styles.checkoutSection}>
                <Button onClick={() => router.push("/checkout")}>
                  Proceed to Checkout
                </Button>
              </div>
            </>
          )}
        </main>
      </div>
    </Layout>
  );
}
