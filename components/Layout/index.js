import React from "react";

import styles from "./layout.module.scss";
import Header from "../Header";
import CategoriesBar from "components/Categories";

export default function Layout({ children, noCategories }) {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Header />
      </div>
      <div className={styles.content}>
        <div className={styles.main}>
          {!noCategories && <CategoriesBar />}
          {children}
        </div>
      </div>
    </div>
  );
}
