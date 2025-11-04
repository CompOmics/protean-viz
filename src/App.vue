<script setup>
import { RouterLink, RouterView } from 'vue-router'
import MainComponent from './components/MainComponent.vue'
</script>

<template lang="pug">
v-app
    v-app-bar(class="elevation-0")
        img(alt="Protean logo" class="logo" src="./assets/logo_24-10.png" width="125" height="75")
        nav
            RouterLink(to="/" class="router-link") Home
            RouterLink(to="/about" class="router-link ml-5") About
        //- nav
        //-   RouterLink(to="/")
        //-     img(src="./assets/logo_24_10.png" alt="home, logo")
        //-   RouterLink(to="/about") About
    v-main
        RouterView
</template>

<style scoped>
header {
  line-height: 1.5;
  max-height: 100vh;
  border-bottom: 1px solid #1ea1e8;
}
/*
main {
  width: 100vw;
}
.logo {
  display: block;
  margin: 0 auto 2rem;
}
*/

nav a.router-link {
  color: #1ea1e8;
  font-size: 18px;
}

nav a.router-link:hover {
  background-color: transparent;
  color: #1573a6;
  font-weight: 700;
}
/*
nav a {

  padding: 0 1rem;
  border-left: 1px solid var(--color-border);
}

nav a:first-of-type {
  border: 0;
}

@media (min-width: 1024px) {
  header {
    display: flex;
    place-items: center;
    padding-right: calc(var(--section-gap) / 2);
  }

  .logo {
    margin: 0 2rem 0 0;
  }

  header .wrapper {
    display: flex;
    place-items: flex-start;
    flex-wrap: wrap;
  }

  nav {
    text-align: left;
    margin-left: -1rem;
    font-size: 1rem;

    padding: 1rem 0;
    margin-top: 1rem;
  }
} */
</style>
