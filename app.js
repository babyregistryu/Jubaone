// Simple client-side renderer using fetched seed JSON (works when hosting or opening via HTTP)
// Replace this with Firestore queries once Firebase is connected.

async function loadSeed(){
  try{
    const resp = await fetch('data/initial_data.json');
    if(!resp.ok) throw new Error('Failed to load seed data: '+resp.status);
    const seedJson = await resp.json();
    renderSite(seedJson);
  }catch(err){
    console.error(err);
    document.getElementById('articles').innerHTML = '<p style="color:#c00">Unable to load content. If you are opening files locally (file://) use a local HTTP server or host the site. See README for instructions.</p>';
  }
}

function renderSite(seedJson){
  const siteTitle = document.getElementById('site-title');
  const yearEl = document.getElementById('year');
  yearEl.textContent = new Date().getFullYear();

  const articlesContainer = document.getElementById('articles');
  const categoryList = document.getElementById('category-list');
  const trendingList = document.getElementById('trending-list');
  const popularList = document.getElementById('popular-list');
  const recentList = document.getElementById('recent-list');

  const articles = seedJson.articles || [];
  const categories = [...new Set(articles.flatMap(a => a.categories || []))].sort();

  function mkArticleCard(a){
    const div = document.createElement('article');
    div.className = 'article';
    div.innerHTML = `<h3><a href="article.html?slug=${encodeURIComponent(a.slug)}">${a.title}</a></h3>
      <p class="meta">By ${a.author} • ${a.date}</p>
      <p>${a.excerpt}</p>
      <a href="article.html?slug=${encodeURIComponent(a.slug)}">Read more →</a>`;
    return div;
  }

  articlesContainer.innerHTML = '';
  articles.slice(0,6).forEach(a => articlesContainer.appendChild(mkArticleCard(a)));
  categoryList.innerHTML = '';
  categories.forEach(c => {
    const li = document.createElement('li');
    li.innerHTML = `<a href="category.html?cat=${encodeURIComponent(c)}">${c}</a>`;
    categoryList.appendChild(li);
  });

  // side lists
  trendingList.innerHTML = '';
  popularList.innerHTML = '';
  recentList.innerHTML = '';
  const trending = articles.filter(a => (a.flags || []).includes('trending')).slice(0,5);
  const popular = articles.filter(a => (a.flags || []).includes('popular')).slice(0,5);
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
  const riddles = articles.filter(a => (a.categories || []).includes('Riddles'));
  if(riddleWidget){
    if(riddles.length){
      const r = riddles[0];
      riddleWidget.innerHTML = `<strong>${r.title}</strong><p>${r.excerpt}</p><a href="article.html?slug=${encodeURIComponent(r.slug)}">Read riddle →</a>`;
    } else {
      riddleWidget.innerHTML = '<p>No riddles yet.</p>';
    }
  }
}

// Start
loadSeed();
