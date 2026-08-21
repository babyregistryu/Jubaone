// Simple client-side renderer using embedded seed JSON (for local hosting)
// When you connect to Firestore, replace this logic to fetch articles from Firestore.

const seedEl = document.getElementById('seed-data');
const seedJson = JSON.parse(seedEl.textContent);

const siteTitle = document.getElementById('site-title');
const yearEl = document.getElementById('year');
yearEl.textContent = new Date().getFullYear();

const articlesContainer = document.getElementById('articles');
const categoryList = document.getElementById('category-list');
const trendingList = document.getElementById('trending-list');
const popularList = document.getElementById('popular-list');
const recentList = document.getElementById('recent-list');

const articles = seedJson.articles;
const categories = [...new Set(articles.flatMap(a => a.categories))].sort();

function mkArticleCard(a){
  const div = document.createElement('article');
  div.className = 'article';
  div.innerHTML = `<h3><a href="article.html?slug=${encodeURIComponent(a.slug)}">${a.title}</a></h3>
    <p class="meta">By ${a.author} • ${a.date}</p>
    <p>${a.excerpt}</p>
    <a href="article.html?slug=${encodeURIComponent(a.slug)}">Read more →</a>`;
  return div;
}

articles.slice(0,6).forEach(a => articlesContainer.appendChild(mkArticleCard(a)));
categories.forEach(c => {
  const li = document.createElement('li');
  li.innerHTML = `<a href="category.html?cat=${encodeURIComponent(c)}">${c}</a>`;
  categoryList.appendChild(li);
});

// side lists
const trending = articles.filter(a => a.flags.includes('trending')).slice(0,5);
const popular = articles.filter(a => a.flags.includes('popular')).slice(0,5);
const recent = articles.slice().sort((a,b)=> new Date(b.date)- new Date(a.date)).slice(0,5);

function mkListItem(a){
  const li = document.createElement('li');
  li.innerHTML = `<a href="article.html?slug=${encodeURIComponent(a.slug)}">${a.title}</a>`;
  return li;
}
trending.forEach(a => trendingList.appendChild(mkListItem(a)));
popular.forEach(a => popularList.appendChild(mkListItem(a)));
recent.forEach(a => recentList.appendChild(mkListItem(a)));

// Riddle widget: show first riddle excerpt
const riddleWidget = document.getElementById('riddle-widget');
const riddles = articles.filter(a => a.categories.includes('Riddles'));
if(riddles.length){
  const r = riddles[0];
  riddleWidget.innerHTML = `<strong>${r.title}</strong><p>${r.excerpt}</p><a href="article.html?slug=${encodeURIComponent(r.slug)}">Read riddle →</a>`;
}
