
// Your Firebase Config
const firebaseConfig = {
    apiKey: "AIzaSyD8YzEuKYAx7RxjckQikV2utU4R7Ym5g2w",
    authDomain: "blocksizedx-comment-sys.firebaseapp.com",
    projectId: "blocksizedx-comment-sys",
    storageBucket: "blocksizedx-comment-sys.firebasestorage.app",
    messagingSenderId: "524581279271",
    appId: "1:524581279271:web:fa462916f822a16f162002",
    measurementId: "G-K7F5ZH2CKC",
    databaseURL: "https://blocksizedx-comment-sys-default-rtdb.firebaseio.com/"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// Comment System JavaScript
let currentUser = null;

// Load Comments FOR EVERYONE immediately
function loadComments() {
    console.log("🔥 Loading comments for everyone...");
    
    database.ref('comments').on('value', (snapshot) => {
        const comments = snapshot.val() || {};
        console.log("📨 Comments loaded:", comments);
        displayComments(comments);
    }, (error) => {
        console.error("❌ Error loading comments:", error);
    });
}

function displayComments(comments) {
    const commentsContainer = document.getElementById('all-comments');
    commentsContainer.innerHTML = '';
    
    if (Object.keys(comments).length === 0) {
        commentsContainer.innerHTML = '<p style="text-align: center; color: #888;">No comments yet. Be the first to comment!</p>';
        return;
    }
    
    // Convert to array and sort by timestamp (newest first)
    const commentsArray = Object.entries(comments)
        .sort(([,a], [,b]) => b.timestamp - a.timestamp);
    
    commentsArray.forEach(([commentId, comment]) => {
        const commentElement = createCommentElement(commentId, comment, false);
        commentsContainer.appendChild(commentElement);
    });
}

function createCommentElement(commentId, comment, isReply = false, parentId = null) {
    const commentDiv = document.createElement('div');
    commentDiv.className = isReply ? 'reply-item' : 'comment-item';
    commentDiv.dataset.commentId = commentId;
    if (parentId) commentDiv.dataset.parentId = parentId;
    
    const timeAgo = getTimeAgo(comment.timestamp);
    const isOwner = currentUser && comment.authorId === currentUser.id;
    const hasLiked = currentUser && comment.likedBy && comment.likedBy[currentUser.id];
    
    commentDiv.innerHTML = `
        <div class="comment-header">
            <span class="comment-author">${comment.author}</span>
            <span class="comment-time">${timeAgo}</span>
        </div>
        <div class="comment-text">${comment.text}</div>
        <div class="comment-actions">
            <span class="comment-action-btn">
                👍 ${comment.likes || 0}
            </span>
            ${currentUser ? `
                <button class="comment-action-btn like-btn ${hasLiked ? 'liked' : ''}" 
                        onclick="toggleLike('${commentId}', ${isReply ? `'${parentId}'` : 'null'})">
                    ${hasLiked ? '👎 Unlike' : '👍 Like'}
                </button>
                <button class="comment-action-btn" onclick="toggleReplyForm('${commentId}')">
                    💬 Reply
                </button>
            ` : `
                <span class="comment-action-btn" style="color: #888;">Login to interact</span>
            `}
            ${isOwner ? `<button class="comment-action-btn delete-btn" onclick="deleteComment('${commentId}', ${isReply ? `'${parentId}'` : 'null'})">🗑️ Delete</button>` : ''}
        </div>
        ${currentUser ? `
        <div class="reply-form" id="reply-form-${commentId}">
            <textarea placeholder="Write your reply..." rows="2"></textarea>
            <button onclick="postReply('${commentId}')">Post Reply</button>
            <button onclick="toggleReplyForm('${commentId}')">Cancel</button>
        </div>
        ` : ''}
        <div class="replies" id="replies-${commentId}">
            ${comment.replies ? Object.entries(comment.replies)
                .sort(([,a], [,b]) => a.timestamp - b.timestamp)
                .map(([replyId, reply]) => createCommentElement(replyId, reply, true, commentId).outerHTML)
                .join('') : ''}
        </div>
    `;
    
    return commentDiv;
}

// User Authentication
function loginUser() {
    const userName = document.getElementById('userName').value.trim();
    if (!userName) {
        alert('Please enter your name');
        return;
    }
    
    currentUser = {
        id: generateUserId(),
        name: userName
    };
    
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    document.getElementById('auth-section').style.display = 'none';
    document.getElementById('comment-form').style.display = 'block';
    // Reload to show interactive buttons
    loadComments();
}

function generateUserId() {
    return 'user_' + Math.random().toString(36).substr(2, 9);
}

// Comment Form Handling
document.getElementById('comment-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const commentText = document.getElementById('comment').value.trim();
    
    if (!commentText) {
        alert('Please write a comment');
        return;
    }
    
    const comment = {
        id: generateCommentId(),
        author: currentUser.name,
        authorId: currentUser.id,
        text: commentText,
        timestamp: Date.now(),
        likes: 0,
        likedBy: {},
        replies: {}
    };
    
    database.ref('comments/' + comment.id).set(comment)
        .then(() => {
            document.getElementById('comment').value = '';
        })
        .catch(error => {
            console.error('Error posting comment:', error);
        });
});

function generateCommentId() {
    return 'comment_' + Date.now();
}

// Comment Actions
function toggleReplyForm(commentId) {
    const form = document.getElementById(`reply-form-${commentId}`);
    form.style.display = form.style.display === 'block' ? 'none' : 'block';
}

function postReply(commentId) {
    const form = document.getElementById(`reply-form-${commentId}`);
    const textarea = form.querySelector('textarea');
    const replyText = textarea.value.trim();
    
    if (!replyText) {
        alert('Please write a reply');
        return;
    }
    
    const reply = {
        id: generateCommentId(),
        author: currentUser.name,
        authorId: currentUser.id,
        text: replyText,
        timestamp: Date.now(),
        likes: 0,
        likedBy: {},
        replies: {} // Can have nested replies too!
    };
    
    database.ref(`comments/${commentId}/replies/${reply.id}`).set(reply)
        .then(() => {
            textarea.value = '';
            form.style.display = 'none';
        })
        .catch(error => {
            console.error('Error posting reply:', error);
        });
}

function toggleLike(commentId, parentId = null) {
    if (!currentUser) {
        alert('Please login to like comments');
        return;
    }
    
    const commentRef = parentId ? 
        database.ref(`comments/${parentId}/replies/${commentId}`) :
        database.ref(`comments/${commentId}`);
    
    commentRef.once('value').then(snapshot => {
        const comment = snapshot.val();
        const likedBy = comment.likedBy || {};
        const hasLiked = likedBy[currentUser.id];
        
        if (hasLiked) {
            // Unlike
            likedBy[currentUser.id] = false;
            comment.likes = (comment.likes || 1) - 1;
        } else {
            // Like
            likedBy[currentUser.id] = true;
            comment.likes = (comment.likes || 0) + 1;
        }
        
        comment.likedBy = likedBy;
        commentRef.update(comment);
    });
}

function deleteComment(commentId, parentId = null) {
    if (!confirm('Are you sure you want to delete this comment?')) return;
    
    if (parentId) {
        // Delete reply
        database.ref(`comments/${parentId}/replies/${commentId}`).remove();
    } else {
        // Delete main comment
        database.ref(`comments/${commentId}`).remove();
    }
}

// Utility Functions
function getTimeAgo(timestamp) {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return Math.floor(seconds / 60) + 'm ago';
    if (seconds < 86400) return Math.floor(seconds / 3600) + 'h ago';
    return Math.floor(seconds / 86400) + 'd ago';
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Load comments for EVERYONE immediately
    loadComments();
    
    // Check if user was already logged in
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        document.getElementById('auth-section').style.display = 'none';
        document.getElementById('comment-form').style.display = 'block';
        // Reload comments to show interactive buttons
        loadComments();
    }
});

// NAV BAR RESPONSIVE
// NAV BAR RESPONSIVE
// NAV BAR RESPONSIVE
const toggle = document.getElementById('menu-toggle');
const navLinks = document.getElementById('navlinks');
const searchContainer = document.querySelector('.search-container');

toggle.addEventListener('click', () => {
    navLinks.classList.toggle('active');
    
    // On mobile, show search when menu is open
    if (window.innerWidth <= 768) {
        if (navLinks.classList.contains('active')) {
            searchContainer.style.display = 'block';
        } else {
            searchContainer.style.display = 'none';
        }
    }
});

// Close menu when clicking on a link (mobile)
document.querySelectorAll('#navlinks a').forEach(link => {
    link.addEventListener('click', () => {
        if (window.innerWidth <= 768) {
            navLinks.classList.remove('active');
            searchContainer.style.display = 'none';
        }
    });
});

// Close menu when clicking outside (mobile)
document.addEventListener('click', (event) => {
    if (window.innerWidth <= 768) {
        if (!event.target.closest('.nav-right-section') && !event.target.closest('.navbar h1')) {
            navLinks.classList.remove('active');
            searchContainer.style.display = 'none';
        }
    }
});
// SCRIPT CHATBOT (unchanged)
(function(){
    const chatbotBtn = document.getElementById('chatbotBtn');
    const chatbotWindow = document.getElementById('chatbotWindow');
    const chatbotClose = document.getElementById('chatbotClose');
    const chatMessages = document.getElementById('chatbotMessages');
    const chatInput = document.getElementById('chatInput');
    const chatSend = document.getElementById('chatSend');

    const responses = [
        {
            keywords: ["whatsapp", "number", "phone number", "phone nomber"],
            answer: "+91 9961550562 is whatsapp number. see you there!"
        },
        {
            keywords: ["keywords", "words", "what is keywords", "search", "what to search", "functions", "questions", "ques", "quest", "find"],
            answer: "You can ask me keywords like Whatsapp, number, templates, projects, games, about, contact and more."
        },
        {
            keywords: ["hi", "hello", "hey", "yo", "whats up", "sup", "heyy", "hii", "hola", "greetings"],
            answer: "Hey there 👋 Welcome to BlockSizedX! Wanna check out some templates or games?"
        },
        {
            keywords: ["nope", "no", "nothing", "onnulla", "onnula", "poda", "poo", "nothing else", "myre", "no da"],
            answer: "Ahh okay, if u wanna know anything, just search for templates, games, etc!"
        },
        {
            keywords: ["who are you", "about", "about site", "this website", "what is blocksizedx", "who made this", "developer", "who built", "owner", "creator"],
            answer: "I'm BlockSizedX — your friendly dev site 💻. I make web & game templates, playable mini-games, and cool open projects!"
        },
        {
            keywords: ["template", "templates", "web templates", "html templates", "css templates", "game templates", "free templates", "cheap templates", "download templates", "buy templates", "sell templates"],
            answer: "We've got both **web templates** and **game templates** — free or super cheap 💸. Check them on the Templates section!"
        },
        {
            keywords: ["game", "games", "play game", "mini games", "test games", "try games", "play online", "arcade", "fun games", "try project"],
            answer: "Yesss 🎮 you can play fun mini games right here on BlockSizedX! Just go to the 'Games' or 'Projects' page and have fun 😎"
        },
        {
            keywords: ["project", "projects", "see projects", "my projects", "view projects", "portfolio", "what projects", "demo projects"],
            answer: "You can explore all my projects on the **Projects page** — from web apps to games and experiments 🚀"
        },
        {
            keywords: ["price", "cost", "free", "cheap", "paid", "buy", "purchase", "how much", "is it free", "download free", "pricing"],
            answer: "Almost everything's **free or super cheap** 💸 — because I want devs like you to build cool stuff easily 😎"
        },
        {
            keywords: ["contact", "message", "email", "mail", "support", "how to contact", "reach you", "chat", "talk", "feedback"],
            answer: "You can contact me anytime at **blocksized404@gmail.com** or through my GitHub page 💌"
        },
        {
            keywords: ["website", "github", "link", "site", "blocksizedx", "page", "blocksized", "repo", "repository"],
            answer: "Visit my official site 🌐 **blocksizedx.github.io** and check all projects there!"
        },
        {
            keywords: ["learn", "tutorial", "code", "source code", "how it works", "view code", "example", "open source"],
            answer: "All templates & games are open-source 👨‍💻 — explore the code and learn! You'll find GitHub links on each project page."
        },
        {
            keywords: ["new", "latest", "update", "recent", "new projects", "what's new", "recent upload"],
            answer: "I keep updating BlockSizedX often ⚡ — check the homepage for latest uploads & projects!"
        },
        {
            keywords: ["thanks", "thank you", "cool", "awesome", "nice", "good job", "love this", "great"],
            answer: "Aww thanks 😄 You're awesome too! Keep exploring BlockSizedX 💪"
        },
        {
            keywords: ["help", "what can you do", "commands", "how to use", "how this works", "guide"],
            answer: "You can ask me about templates, projects, games, or how to contact BlockSizedX 😎"
        },
        {
            keywords: ["brother", "your brother", "about brother","aahil","aahi", "bro", "what is blocksizedx brother", "broo", "broother", "bad"],
            answer: "Its my bro!,Aahil and he is a lil bit crazy haha. "
        },
    ];

    const fallback = "Sorry, I didn't get that 😅 — search fo keywords for please email us at blocksized404@gmail.com .";

    function formatTime(date){
        const h = date.getHours(), m = date.getMinutes();
        return (h<10?'0':'')+h + ":" + (m<10?'0':'')+m;
    }

    function appendMessage(text, who){
        const hint = chatMessages.querySelector('.chatbot-empty-hint');
        if (hint) hint.remove();

        const msg = document.createElement('div');
        msg.classList.add('chat-msg', who === 'user' ? 'user' : 'bot');
        msg.textContent = text;

        const ts = document.createElement('div');
        ts.classList.add('chat-timestamp');
        ts.textContent = formatTime(new Date());

        const wrap = document.createElement('div');
        wrap.style.display = 'flex';
        wrap.style.flexDirection = 'column';
        wrap.appendChild(msg);
        wrap.appendChild(ts);

        chatMessages.appendChild(wrap);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function findResponse(userText){
        const txt = userText.toLowerCase();
        for (let obj of responses){
        for (let kw of obj.keywords){
            if (txt.includes(kw)) return obj.answer;
        }
        }
        return null;
    }

    function handleSend(){
        const text = chatInput.value.trim();
        if (!text) return;
        appendMessage(text, 'user');
        chatInput.value = '';
        setTimeout(()=>{
        const reply = findResponse(text) || fallback;
        appendMessage(reply, 'bot');
        }, 400);
    }

    chatbotBtn.onclick = ()=>{
        const open = chatbotWindow.style.display === 'flex';
        chatbotWindow.style.display = open ? 'none' : 'flex';
        chatbotWindow.setAttribute('aria-hidden', open);
        if (!open) setTimeout(()=> chatInput.focus(), 150);
    };

    chatbotClose.onclick = ()=>{
        chatbotWindow.style.display = 'none';
        chatbotWindow.setAttribute('aria-hidden', 'true');
    };

    chatSend.onclick = handleSend;
    chatInput.addEventListener('keydown', e=>{
        if(e.key==='Enter'){ e.preventDefault(); handleSend(); }
    });

    setTimeout(()=>{
        if (!chatMessages.querySelector('.chat-msg')){
        appendMessage("Hello 👋 I'm your assistant. How can I help?", 'bot');
        }
    }, 700);
})();









// Search Functionality
const searchData = [
    { id: 'home', title: 'Home', type: 'Page', section: 'HOME', icon: 'fa-home' },
    { id: 'templates', title: 'Templates', type: 'Section', section: 'templates', icon: 'fa-file-code-o' },
    { id: 'web-templates', title: 'Website Templates', type: 'Category', section: 'templates', icon: 'fa-desktop' },
    { id: 'game-templates', title: 'Game Templates', type: 'Category', section: 'templates', icon: 'fa-gamepad' },
    { id: 'projects', title: 'Projects & Games', type: 'Section', section: 'projects', icon: 'fa-rocket' },
    { id: 'about', title: 'About Us', type: 'Section', section: 'about', icon: 'fa-info-circle' },
    { id: 'contact', title: 'Contact Us', type: 'Section', section: 'contact', icon: 'fa-envelope' },
    { id: 'comments', title: 'Comments & Reviews', type: 'Section', section: 'comments', icon: 'fa-comments' },
    { id: 'contact-info', title: 'Contact Information', type: 'Section', section: 'contact-info', icon: 'fa-address-card' },
    { id: 'portfolio-template', title: 'Portfolio Template', type: 'Template', section: 'templates', icon: 'fa-download' },
    { id: 'business-template', title: 'Business Template', type: 'Template', section: 'templates', icon: 'fa-briefcase' },
    { id: 'platformer-template', title: '2D Platformer Template', type: 'Game Template', section: 'templates', icon: 'fa-gamepad' },
    { id: 'space-shooter', title: 'Space Shooter Template', type: 'Game Template', section: 'templates', icon: 'fa-space-shuttle' }
];

function performSearch() {
    const searchTerm = document.getElementById('navSearch').value.toLowerCase().trim();
    const resultsContainer = document.getElementById('searchResults');
    
    if (!searchTerm) {
        resultsContainer.style.display = 'none';
        return;
    }
    
    const filteredResults = searchData.filter(item => 
        item.title.toLowerCase().includes(searchTerm) || 
        item.type.toLowerCase().includes(searchTerm)
    );
    
    displaySearchResults(filteredResults);
}

function displaySearchResults(results) {
    const resultsContainer = document.getElementById('searchResults');
    
    if (results.length === 0) {
        resultsContainer.innerHTML = '<div class="no-results">No results found</div>';
        resultsContainer.style.display = 'block';
        return;
    }
    
    resultsContainer.innerHTML = results.map(item => `
        <div class="search-result-item" onclick="scrollToSection('${item.section}')">
            <i class="fa ${item.icon}"></i>
            <span>${item.title}</span>
            <span class="result-type">${item.type}</span>
        </div>
    `).join('');
    
    resultsContainer.style.display = 'block';
}

function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        // Close search results
        document.getElementById('searchResults').style.display = 'none';
        
        // Smooth scroll to section
        section.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
        });
        
        // Add highlight effect
        section.style.transition = 'all 0.5s ease';
        section.style.boxShadow = '0 0 0 2px rgba(255, 213, 76, 0.5)';
        
        setTimeout(() => {
            section.style.boxShadow = 'none';
        }, 2000);
    }
}

// Close search results when clicking outside
document.addEventListener('click', function(event) {
    const searchContainer = document.querySelector('.search-container');
    const searchResults = document.getElementById('searchResults');
    
    if (!searchContainer.contains(event.target)) {
        searchResults.style.display = 'none';
    }
});

// Search on Enter key
document.getElementById('navSearch').addEventListener('keyup', function(event) {
    if (event.key === 'Enter') {
        performSearch();
    }
});

// Real-time search (optional - uncomment if you want instant search)
// document.getElementById('navSearch').addEventListener('input', performSearch);






//SORTING PROJECTS

// Projects Filter Functionality
document.addEventListener('DOMContentLoaded', function() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    const projectCards = document.querySelectorAll('.project-card');
    
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all buttons
            filterBtns.forEach(b => b.classList.remove('active'));
            // Add active class to clicked button
            btn.classList.add('active');
            
            const filter = btn.getAttribute('data-filter');
            
            projectCards.forEach(card => {
                const category = card.getAttribute('data-category');
                
                if (filter === 'all' || category === filter) {
                    card.style.display = 'block';
                    setTimeout(() => {
                        card.style.opacity = '1';
                        card.style.transform = 'scale(1)';
                    }, 100);
                } else {
                    card.style.opacity = '0';
                    card.style.transform = 'scale(0.8)';
                    setTimeout(() => {
                        card.style.display = 'none';
                    }, 300);
                }
            });
        });
    });
});




