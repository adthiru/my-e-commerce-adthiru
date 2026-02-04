import React from "react";
import { useRouter } from "next/router";
import Link from "next/link";

import Layout from "@/components/Layout";
import AccountSidebar from "@/components/AccountSidebar";
import ProductCard from "@/components/ProductCard/product-card";
import { useAuth } from "@/firebase/context";
import { useFavorites } from "hooks/favorites.hook";

import styles from "./favorites.module.scss";

export default function Favorites() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { data: favorites, loading } = useFavorites();

  if (!authLoading && !user) {
    router.push("/login");
    return null;
  }

  return (
    <Layout noCategories>
      <AccountSidebar />
      <main className={styles.container}>
        <h1 className={styles.title}>My Wishlist</h1>
        <div className={styles.content}>
          {loading ? (
            <p>Loading...</p>
          ) : favorites.length === 0 ? (
            <div className={styles.empty}>
              <p>Your wishlist is empty</p>
              <Link href="/">
                <a className={styles.link}>Browse Products</a>
              </Link>
            </div>
          ) : (
            <div className={styles.grid}>
              {favorites.map((product) => (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  brand={product.brand}
                  name={product.product_name}
                  price={product.price}
                  sale_price={product.sale_price}
                  image={product.cover_photo}
                  favorite={true}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </Layout>
  );
}
