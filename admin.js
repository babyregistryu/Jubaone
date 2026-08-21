// Admin panel functionality. This file assumes you will paste a Firebase config object into the textarea
// and click Save Config. It will initialize Firebase, sign-in/out, and read/write to Firestore/Storage.
// Role-based access uses custom claims. The README explains how to set custom claims for users.

let app=null, auth=null, db=null, storage=null;
let currentUser=null;

// DOM
const btnSaveConfig = document.getElementById('btn-save-config');
const txtConfig = document.getElementById('firebase-config');
const btnSignIn = document.getElementById('btn-signin');
const btnSignOut = document.getElementById('btn-signout');
const emailIn = document.getElementById('email');
const passIn = document.getElementById('password');
const userInfo = document.getElementById('user-info');
const userEmail = document.getElementById('user-email');
const signInForm = document.getElementById('sign-in-form');

const btnLoadSeed = document.getElementById('btn-load-seed');
const btnNewArticle = document.getElementById('btn-new-article');
const articlesList = document.getElementById('articles-list');
const articleEditor = document.getElementById('article-editor');

const topBanner = document.getElementById('top-banner');
const footerText = document.getElementById('footer-text');
const btnSaveSettings = document.getElementById('btn-save-settings');

btnSaveConfig.onclick = () => {
  let cfg;
  try {
    cfg = JSON.parse(txtConfig.value);
  } catch(e){
    alert('Invalid JSON');
    return;
  }
  // initialize firebase
  if(window.firebase && !app){
    app = firebase.initializeApp(cfg);
    auth = firebase.auth();
    db = firebase.firestore();
    storage = firebase.storage();
    setupAuthListener();
    alert('Firebase initialized. Sign in to continue.');
  } else {
    alert('Firebase SDK not available or already initialized.');
  }
};

function setupAuthListener(){
  auth.onAuthStateChanged(async user => {
    currentUser = user;
    if(user){
      signInForm.style.display='none';
      userInfo.style.display='block';
      userEmail.textContent = user.email;
      // fetch custom claims via getIdTokenResult
      const idTokenRes = await user.getIdTokenResult(true);
      const claims = idTokenRes.claims || {};
      userInfo.dataset.role = claims.role || 'author';
      loadAdminData();
    } else {
      signInForm.style.display='block';
      userInfo.style.display='none';
      userEmail.textContent = '';
    }
  });
}

btnSignIn.onclick = async () => {
  try {
    await auth.signInWithEmailAndPassword(emailIn.value, passIn.value);
  } catch(e){
    alert('Sign in failed: ' + e.message);
  }
};
btnSignOut.onclick = () => auth.signOut();

async function loadAdminData(){
  // Load basic site settings
  const settingsDoc = await db.collection('site').doc('settings').get().catch(()=>null);
  if(settingsDoc && settingsDoc.exists){
    const s = settingsDoc.data();
    topBanner.value = s.topBanner || '';
    footerText.value = s.footerText || '';
  }
  // Load articles
  renderArticles();
  // Load authors
  renderAuthors();
}

async function renderArticles(){
  articlesList.innerHTML = '';
  const q = await db.collection('articles').orderBy('date','desc').limit(200).get();
  q.forEach(doc => {
    const a = doc.data();
    const row = document.createElement('div');
    row.className='article-row';
    row.innerHTML = `<div><strong>${a.title}</strong><div style="color:#666">${a.author} • ${a.date}</div></div>
      <div>
        <button data-id="${doc.id}" class="btn-edit">Edit</button>
        <button data-id="${doc.id}" class="btn-del">Delete</button>
      </div>`;
    articlesList.appendChild(row);
  });

  document.querySelectorAll('.btn-edit').forEach(b => b.onclick = e => editArticle(e.target.dataset.id));
  document.querySelectorAll('.btn-del').forEach(b => b.onclick = e => deleteArticle(e.target.dataset.id));
}

async function editArticle(id){
  articleEditor.style.display='block';
  articleEditor.innerHTML = '<p>Loading editor…</p>';
  const doc = await db.collection('articles').doc(id).get();
  if(!doc.exists){ articleEditor.innerHTML='Article not found'; return; }
  const a = doc.data();
  articleEditor.innerHTML = `
    <label>Title <input id="ed-title" value="${a.title.replace(/"/g,'&quot;')}" /></label>
    <label>Slug <input id="ed-slug" value="${a.slug}" /></label>
    <label>Author <input id="ed-author" value="${a.author}" /></label>
    <label>Categories (comma separated) <input id="ed-cats" value="${a.categories.join(', ')}" /></label>
    <label>Flags (comma separated: trending,popular) <input id="ed-flags" value="${a.flags.join(', ')}" /></label>
    <label>Excerpt <textarea id="ed-excerpt">${a.excerpt}</textarea></label>
    <label>Content (HTML) <textarea id="ed-content" rows="12">${a.content.replace(/</g,'&lt;')}</textarea></label>
    <label>Upload image <input id="ed-file" type="file" /></label>
    <button id="ed-save">Save</button>
    <button id="ed-cancel">Cancel</button>
  `;
  document.getElementById('ed-cancel').onclick = ()=> articleEditor.style.display='none';
  document.getElementById('ed-save').onclick = async ()=>{
    const updated = {
      title: document.getElementById('ed-title').value,
      slug: document.getElementById('ed-slug').value,
      author: document.getElementById('ed-author').value,
      categories: document.getElementById('ed-cats').value.split(',').map(s=>s.trim()).filter(Boolean),
      flags: document.getElementById('ed-flags').value.split(',').map(s=>s.trim()).filter(Boolean),
      excerpt: document.getElementById('ed-excerpt').value,
      content: document.getElementById('ed-content').value,
      date: new Date().toISOString().split('T')[0]
    };
    const fileInput = document.getElementById('ed-file');
    if(fileInput.files && fileInput.files[0]){
      const f = fileInput.files[0];
      const ref = storage.ref().child('uploads/' + Date.now() + '_' + f.name);
      const snap = await ref.put(f);
      updated.featuredImage = await snap.ref.getDownloadURL();
    }
    await db.collection('articles').doc(id).set(updated, {merge:true});
    alert('Saved');
    renderArticles();
    articleEditor.style.display='none';
  };
}

async function deleteArticle(id){
  if(!confirm('Delete this article?')) return;
  await db.collection('articles').doc(id).delete();
  alert('Deleted');
  renderArticles();
}

btnNewArticle.onclick = ()=>{
  articleEditor.style.display='block';
  articleEditor.innerHTML = `
    <label>Title <input id="ed-title" /></label>
    <label>Slug <input id="ed-slug" /></label>
    <label>Author <input id="ed-author" /></label>
    <label>Categories (comma separated) <input id="ed-cats" /></label>
    <label>Flags (comma separated: trending,popular) <input id="ed-flags" /></label>
    <label>Excerpt <textarea id="ed-excerpt"></textarea></label>
    <label>Content (HTML) <textarea id="ed-content" rows="12"></textarea></label>
    <label>Upload image <input id="ed-file" type="file" /></label>
    <button id="ed-save">Create</button>
    <button id="ed-cancel">Cancel</button>
  `;
  document.getElementById('ed-cancel').onclick = ()=> articleEditor.style.display='none';
  document.getElementById('ed-save').onclick = async ()=>{
    const newDoc = {
      title: document.getElementById('ed-title').value,
      slug: document.getElementById('ed-slug').value,
      author: document.getElementById('ed-author').value,
      categories: document.getElementById('ed-cats').value.split(',').map(s=>s.trim()).filter(Boolean),
      flags: document.getElementById('ed-flags').value.split(',').map(s=>s.trim()).filter(Boolean),
      excerpt: document.getElementById('ed-excerpt').value,
      content: document.getElementById('ed-content').value,
      date: new Date().toISOString().split('T')[0],
      views: 0
    };
    const fileInput = document.getElementById('ed-file');
    if(fileInput.files && fileInput.files[0]){
      const f = fileInput.files[0];
      const ref = storage.ref().child('uploads/' + Date.now() + '_' + f.name);
      const snap = await ref.put(f);
      newDoc.featuredImage = await snap.ref.getDownloadURL();
    }
    await db.collection('articles').add(newDoc);
    alert('Created');
    renderArticles();
    articleEditor.style.display='none';
  };
};

btnLoadSeed.onclick = async ()=>{
  if(!confirm('This will write seed articles to your Firestore project under the "articles" collection. Continue?')) return;
  // fetch local seed JSON file (bundled)
  const resp = await fetch('data/initial_data.json');
  const seed = await resp.json();
  for(const a of seed.articles){
    const docRef = db.collection('articles').doc(a.slug);
    await docRef.set({...a});
  }
  alert('Seed data loaded');
  renderArticles();
};

btnSaveSettings.onclick = async ()=>{
  await db.collection('site').doc('settings').set({
    topBanner: topBanner.value,
    footerText: footerText.value
  }, {merge:true});
  alert('Settings saved');
};

// Authors (simple)
async function renderAuthors(){
  const el = document.getElementById('authors-list');
  el.innerHTML = '';
  const q = await db.collection('authors').get();
  q.forEach(d => {
    const a = d.data();
    const div = document.createElement('div');
    div.innerHTML = `<strong>${a.name}</strong> <small>${a.email}</small> <div>Role: ${a.role || 'author'}</div>`;
    el.appendChild(div);
  });
}
document.getElementById('btn-add-author').onclick = async ()=>{
  const name = prompt('Author name');
  const email = prompt('Email');
  const role = prompt('Role (admin/moderator/author)', 'author');
  if(!name || !email) return;
  await db.collection('authors').add({name,email,role});
  renderAuthors();
};

// Legal editor
document.getElementById('btn-edit-legal').onclick = async ()=>{
  const k = document.getElementById('legal-select').value;
  const docRef = db.collection('legal').doc(k);
  const doc = await docRef.get();
  const content = doc.exists ? doc.data().content : '';
  const ed = document.getElementById('legal-editor');
  ed.style.display='block';
  ed.innerHTML = `<textarea id="legal-content" rows="12">${content}</textarea><button id="save-legal">Save</button>`;
  document.getElementById('save-legal').onclick = async ()=>{
    await docRef.set({content: document.getElementById('legal-content').value});
    alert('Saved');
    ed.style.display='none';
  };
};
