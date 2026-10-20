/* 10-celular.js — feito na montagem: o botão ☰ (o 4.6 desenhou, mas não ligou).
   No celular abre/fecha a barra por cima; no computador recolhe/mostra a barra. */
(function () {
  'use strict';
  const celular = () => window.matchMedia('(max-width: 760px)').matches;
  function alternar() {
    if (celular()) document.body.classList.toggle('menu-aberto');
    else { const s = document.getElementById('sidebar'); s.classList.toggle('collapsed'); document.getElementById('app').classList.toggle('sem-menu', s.classList.contains('collapsed')); }
  }
  document.addEventListener('DOMContentLoaded', () => {
    const bt = document.getElementById('btn-toggle-sidebar');
    if (bt) bt.addEventListener('click', alternar);
    // escolheu um módulo no celular → fecha o menu
    document.querySelectorAll('#sidebar .nav-item').forEach((n) => n.addEventListener('click', () => { if (celular()) document.body.classList.remove('menu-aberto'); }));
    // tocar fora fecha
    document.addEventListener('click', (e) => { if (celular() && document.body.classList.contains('menu-aberto') && !e.target.closest('#sidebar') && !e.target.closest('#btn-toggle-sidebar')) document.body.classList.remove('menu-aberto'); });
  });
})();
