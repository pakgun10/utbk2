<template>
  <div class="app-wrapper">
    <header class="app-header">
      <router-link to="/" class="app-logo">UTBK Belajar</router-link>
    </header>
    <main class="app-main">
      <router-view />
    </main>
    <footer class="app-footer">
      PakGun@2026 - Terimakasih banghasan.com, semoga Allah melimpahi keberkahan kepada engkau
    </footer>
  </div>
</template>

<style>
*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
  background: #f0f4f8;
  color: #1a2b3c;
  line-height: 1.6;
  min-height: 100vh;
}

.app-wrapper {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 16px;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.app-header {
  padding: 20px 0;
  border-bottom: 1px solid #d4dde6;
  margin-bottom: 32px;
}

.app-logo {
  font-size: 1.4rem;
  font-weight: 700;
  color: #1e40af;
  text-decoration: none;
}

.app-main {
  flex: 1;
  padding-bottom: 32px;
}

.app-footer {
  text-align: center;
  padding: 24px 0;
  color: #64748b;
  font-size: 0.85rem;
  border-top: 1px solid #d4dde6;
  margin-top: auto;
}
</style>
