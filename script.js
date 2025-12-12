


// NAV BAR RESPONSIVE
// NAV BAR RESPONSIVE
// NAV BAR RESPONSIVE
// MOBILE NAVBAR FIX
// NAV BAR RESPONSIVE - FIXED VERSION
const toggle = document.getElementById('menu-toggle');
const navLinks = document.getElementById('navlinks');
const searchContainer = document.querySelector('.search-container');

toggle.addEventListener('click', (e) => {
    e.stopPropagation();
    navLinks.classList.toggle('active');
    
    if (window.innerWidth <= 768) {
        if (navLinks.classList.contains('active')) {
            searchContainer.style.display = 'block';
        } else {
            searchContainer.style.display = 'none';
        }
    }
});

// FIXED: Close menu only when clicking outside - BUT DON'T CLOSE SEARCH
document.addEventListener('click', (e) => {
    if (window.innerWidth <= 768) {
        // ONLY close if clicking outside AND not on search results
        if (!e.target.closest('.nav-right-section') && !e.target.closest('.navbar h1') && !e.target.closest('#searchResults')) {
            navLinks.classList.remove('active');
            searchContainer.style.display = 'none';
        }
    }
});

// FIX: Search function
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

// FIX: Display search results with proper mobile handling
function displaySearchResults(results) {
    const resultsContainer = document.getElementById('searchResults');
    
    if (results.length === 0) {
        resultsContainer.innerHTML = '<div class="no-results">No results found</div>';
        resultsContainer.style.display = 'block';
        return;
    }
    
    resultsContainer.innerHTML = results.map(item => `
        <div class="search-result-item" data-section="${item.section}">
            <i class="fa ${item.icon}"></i>
            <span>${item.title}</span>
            <span class="result-type">${item.type}</span>
        </div>
    `).join('');
    
    resultsContainer.style.display = 'block';
    
    // Add fresh event listeners
    document.querySelectorAll('.search-result-item').forEach(item => {
        item.addEventListener('click', function() {
            const section = this.getAttribute('data-section');
            
            // Close all menus
            navLinks.classList.remove('active');
            searchContainer.style.display = 'none';
            resultsContainer.style.display = 'none';
            
            // Scroll to section
            setTimeout(() => {
                scrollToSection(section);
            }, 200);
        });
    });
}

// FIX: Scroll function
function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
        });
        
        section.style.transition = 'all 0.5s ease';
        section.style.boxShadow = '0 0 0 2px rgba(255, 213, 76, 0.5)';
        
        setTimeout(() => {
            section.style.boxShadow = 'none';
        }, 2000);
    }
}
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
            keywords: ["tri", "thirumondha", "mandan", "pottan"],
            answer: "That is 100% my brother hahahahaha. that ttrimondha bro"
        },
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
// FIXED SEARCH FUNCTIONALITY - NO INSTA CLOSING
// COMPLETELY FIXED SEARCH - NO CLOSING
// BULLETPROOF SEARCH FIX
// MASSIVE SEARCH DATA
const searchData = [
    // PAGES
    { id: 'home', title: 'Home', type: 'Page', section: 'HOME', icon: 'fa-home' },
    { id: 'templates', title: 'Templates', type: 'Page', section: 'templates', icon: 'fa-file-code-o' },
    { id: 'projects', title: 'Projects & Games', type: 'Page', section: 'projects', icon: 'fa-rocket' },
    { id: 'about', title: 'About Us', type: 'Page', section: 'about', icon: 'fa-info-circle' },
    { id: 'contact', title: 'Contact Us', type: 'Page', section: 'contact', icon: 'fa-envelope' },
    { id: 'comments', title: 'Comments & Reviews', type: 'Page', section: 'comments', icon: 'fa-comments' },

    // WEBSITE TEMPLATES
    { id: 'portfolio-template', title: 'Portfolio Template', type: 'Website Template', section: 'templates', icon: 'fa-briefcase' },
    { id: 'business-template', title: 'Business Template', type: 'Website Template', section: 'templates', icon: 'fa-building' },
    { id: 'ecommerce-template', title: 'Ecommerce Template', type: 'Website Template', section: 'templates', icon: 'fa-shopping-cart' },
    { id: 'blog-template', title: 'Blog Template', type: 'Website Template', section: 'templates', icon: 'fa-rss' },
    { id: 'restaurant-template', title: 'Restaurant Template', type: 'Website Template', section: 'templates', icon: 'fa-cutlery' },
    { id: 'hotel-template', title: 'Hotel Template', type: 'Website Template', section: 'templates', icon: 'fa-bed' },
    { id: 'medical-template', title: 'Medical Template', type: 'Website Template', section: 'templates', icon: 'fa-heartbeat' },
    { id: 'education-template', title: 'Education Template', type: 'Website Template', section: 'templates', icon: 'fa-graduation-cap' },
    { id: 'agency-template', title: 'Agency Template', type: 'Website Template', section: 'templates', icon: 'fa-users' },
    { id: 'landing-template', title: 'Landing Page Template', type: 'Website Template', section: 'templates', icon: 'fa-flag' },

    // GAME TEMPLATES
    { id: 'platformer-template', title: '2D Platformer Template', type: 'Game Template', section: 'templates', icon: 'fa-gamepad' },
    { id: 'space-shooter', title: 'Space Shooter Template', type: 'Game Template', section: 'templates', icon: 'fa-space-shuttle' },
    { id: 'puzzle-game', title: 'Puzzle Game Template', type: 'Game Template', section: 'templates', icon: 'fa-puzzle-piece' },
    { id: 'racing-game', title: 'Racing Game Template', type: 'Game Template', section: 'templates', icon: 'fa-car' },
    { id: 'rpg-game', title: 'RPG Game Template', type: 'Game Template', section: 'templates', icon: 'fa-shield' },
    { id: 'fps-game', title: 'FPS Game Template', type: 'Game Template', section: 'templates', icon: 'fa-crosshairs' },
    { id: 'arcade-game', title: 'Arcade Game Template', type: 'Game Template', section: 'templates', icon: 'fa-joystick' },
    { id: 'strategy-game', title: 'Strategy Game Template', type: 'Game Template', section: 'templates', icon: 'fa-chess' },
    { id: 'adventure-game', title: 'Adventure Game Template', type: 'Game Template', section: 'templates', icon: 'fa-map' },
    { id: 'casual-game', title: 'Casual Game Template', type: 'Game Template', section: 'templates', icon: 'fa-mobile' },

    // PROJECTS & GAMES
    { id: 'snake-game', title: 'Snake Game', type: 'Playable Game', section: 'projects', icon: 'fa-snake' },
    { id: 'tetris-game', title: 'Tetris Game', type: 'Playable Game', section: 'projects', icon: 'fa-cubes' },
    { id: 'pong-game', title: 'Pong Game', type: 'Playable Game', section: 'projects', icon: 'fa-table-tennis' },
    { id: 'memory-game', title: 'Memory Card Game', type: 'Playable Game', section: 'projects', icon: 'fa-brain' },
    { id: 'tic-tac-toe', title: 'Tic Tac Toe', type: 'Playable Game', section: 'projects', icon: 'fa-times-circle' },
    { id: 'calculator-app', title: 'Calculator App', type: 'Web App', section: 'projects', icon: 'fa-calculator' },
    { id: 'weather-app', title: 'Weather App', type: 'Web App', section: 'projects', icon: 'fa-cloud' },
    { id: 'todo-app', title: 'Todo List App', type: 'Web App', section: 'projects', icon: 'fa-check-square' },
    { id: 'chat-app', title: 'Chat Application', type: 'Web App', section: 'projects', icon: 'fa-comments' },
    { id: 'music-player', title: 'Music Player', type: 'Web App', section: 'projects', icon: 'fa-music' },

    // FRAMEWORKS & TECHNOLOGIES
    { id: 'html-templates', title: 'HTML Templates', type: 'Technology', section: 'templates', icon: 'fa-html5' },
    { id: 'css-templates', title: 'CSS Templates', type: 'Technology', section: 'templates', icon: 'fa-css3' },
    { id: 'javascript-templates', title: 'JavaScript Templates', type: 'Technology', section: 'templates', icon: 'fa-js' },
    { id: 'react-templates', title: 'React Templates', type: 'Framework', section: 'templates', icon: 'fa-react' },
    { id: 'vue-templates', title: 'Vue Templates', type: 'Framework', section: 'templates', icon: 'fa-vuejs' },
    { id: 'angular-templates', title: 'Angular Templates', type: 'Framework', section: 'templates', icon: 'fa-angular' },
    { id: 'nodejs-projects', title: 'Node.js Projects', type: 'Backend', section: 'projects', icon: 'fa-node-js' },
    { id: 'python-projects', title: 'Python Projects', type: 'Backend', section: 'projects', icon: 'fa-python' },
    { id: 'php-projects', title: 'PHP Projects', type: 'Backend', section: 'projects', icon: 'fa-php' },

    // CATEGORIES
    { id: 'web-templates', title: 'Website Templates', type: 'Category', section: 'templates', icon: 'fa-desktop' },
    { id: 'game-templates', title: 'Game Templates', type: 'Category', section: 'templates', icon: 'fa-gamepad' },
    { id: 'mobile-templates', title: 'Mobile Templates', type: 'Category', section: 'templates', icon: 'fa-mobile' },
    { id: 'free-templates', title: 'Free Templates', type: 'Category', section: 'templates', icon: 'fa-gift' },
    { id: 'premium-templates', title: 'Premium Templates', type: 'Category', section: 'templates', icon: 'fa-crown' },

    // FEATURES
    { id: 'responsive-design', title: 'Responsive Design', type: 'Feature', section: 'templates', icon: 'fa-tablet' },
    { id: 'seo-friendly', title: 'SEO Friendly', type: 'Feature', section: 'templates', icon: 'fa-search' },
    { id: 'fast-loading', title: 'Fast Loading', type: 'Feature', section: 'templates', icon: 'fa-bolt' },
    { id: 'mobile-first', title: 'Mobile First', type: 'Feature', section: 'templates', icon: 'fa-mobile-alt' },
    { id: 'cross-browser', title: 'Cross Browser', type: 'Feature', section: 'templates', icon: 'fa-chrome' },

    // CONTACT & INFO
    { id: 'contact-info', title: 'Contact Information', type: 'Info', section: 'contact', icon: 'fa-address-card' },
    { id: 'email-contact', title: 'Email Contact', type: 'Info', section: 'contact', icon: 'fa-envelope-o' },
    { id: 'whatsapp-contact', title: 'WhatsApp Contact', type: 'Info', section: 'contact', icon: 'fa-whatsapp' },
    { id: 'github-profile', title: 'GitHub Profile', type: 'Info', section: 'about', icon: 'fa-github' },
    { id: 'linkedin-profile', title: 'LinkedIn Profile', type: 'Info', section: 'about', icon: 'fa-linkedin' },

    // PRICING & DOWNLOADS
    { id: 'free-download', title: 'Free Download', type: 'Download', section: 'templates', icon: 'fa-download' },
    { id: 'premium-purchase', title: 'Premium Purchase', type: 'Purchase', section: 'templates', icon: 'fa-shopping-bag' },
    { id: 'price-list', title: 'Price List', type: 'Pricing', section: 'templates', icon: 'fa-tag' },
    { id: 'discount-offers', title: 'Discount Offers', type: 'Offer', section: 'templates', icon: 'fa-percent' },

    // SUPPORT
    { id: 'documentation', title: 'Documentation', type: 'Support', section: 'about', icon: 'fa-book' },
    { id: 'tutorials', title: 'Tutorials', type: 'Support', section: 'about', icon: 'fa-graduation-cap' },
    { id: 'faq', title: 'FAQ', type: 'Support', section: 'about', icon: 'fa-question-circle' },
    { id: 'support-team', title: 'Support Team', type: 'Support', section: 'contact', icon: 'fa-headset' },

    // SOCIAL MEDIA
    { id: 'youtube-channel', title: 'YouTube Channel', type: 'Social', section: 'about', icon: 'fa-youtube' },
    { id: 'twitter-profile', title: 'Twitter Profile', type: 'Social', section: 'about', icon: 'fa-twitter' },
    { id: 'instagram-profile', title: 'Instagram Profile', type: 'Social', section: 'about', icon: 'fa-instagram' },
    { id: 'facebook-page', title: 'Facebook Page', type: 'Social', section: 'about', icon: 'fa-facebook' },

    // BLOG & NEWS
    { id: 'blog-posts', title: 'Blog Posts', type: 'Blog', section: 'projects', icon: 'fa-newspaper-o' },
    { id: 'latest-news', title: 'Latest News', type: 'News', section: 'projects', icon: 'fa-bullhorn' },
    { id: 'updates', title: 'Recent Updates', type: 'Updates', section: 'projects', icon: 'fa-sync' },
    { id: 'changelog', title: 'Changelog', type: 'Updates', section: 'about', icon: 'fa-history' },

    // TOOLS & UTILITIES
    { id: 'code-editor', title: 'Online Code Editor', type: 'Tool', section: 'projects', icon: 'fa-code' },
    { id: 'color-picker', title: 'Color Picker Tool', type: 'Tool', section: 'projects', icon: 'fa-eyedropper' },
    { id: 'image-editor', title: 'Image Editor', type: 'Tool', section: 'projects', icon: 'fa-image' },
    { id: 'font-generator', title: 'Font Generator', type: 'Tool', section: 'projects', icon: 'fa-font' },

    // E-COMMERCE
    { id: 'shop-template', title: 'Online Shop Template', type: 'E-commerce', section: 'templates', icon: 'fa-store' },
    { id: 'product-catalog', title: 'Product Catalog', type: 'E-commerce', section: 'templates', icon: 'fa-th-list' },
    { id: 'shopping-cart', title: 'Shopping Cart', type: 'E-commerce', section: 'templates', icon: 'fa-shopping-basket' },
    { id: 'payment-gateway', title: 'Payment Gateway', type: 'E-commerce', section: 'templates', icon: 'fa-credit-card' },

    // PORTFOLIO
    { id: 'photographer-portfolio', title: 'Photographer Portfolio', type: 'Portfolio', section: 'templates', icon: 'fa-camera' },
    { id: 'designer-portfolio', title: 'Designer Portfolio', type: 'Portfolio', section: 'templates', icon: 'fa-paint-brush' },
    { id: 'developer-portfolio', title: 'Developer Portfolio', type: 'Portfolio', section: 'templates', icon: 'fa-laptop-code' },
    { id: 'artist-portfolio', title: 'Artist Portfolio', type: 'Portfolio', section: 'templates', icon: 'fa-palette' },

    // EDUCATION
    { id: 'course-template', title: 'Online Course Template', type: 'Education', section: 'templates', icon: 'fa-chalkboard-teacher' },
    { id: 'school-template', title: 'School Website Template', type: 'Education', section: 'templates', icon: 'fa-school' },
    { id: 'university-template', title: 'University Template', type: 'Education', section: 'templates', icon: 'fa-university' },
    { id: 'learning-platform', title: 'Learning Platform', type: 'Education', section: 'templates', icon: 'fa-book-reader' },

    // ENTERTAINMENT
    { id: 'movie-template', title: 'Movie Website Template', type: 'Entertainment', section: 'templates', icon: 'fa-film' },
    { id: 'music-template', title: 'Music Website Template', type: 'Entertainment', section: 'templates', icon: 'fa-music' },
    { id: 'event-template', title: 'Event Website Template', type: 'Entertainment', section: 'templates', icon: 'fa-calendar' },
    { id: 'booking-template', title: 'Booking System Template', type: 'Entertainment', section: 'templates', icon: 'fa-ticket' },

    // BUSINESS
    { id: 'corporate-template', title: 'Corporate Website', type: 'Business', section: 'templates', icon: 'fa-building-o' },
    { id: 'startup-template', title: 'Startup Website', type: 'Business', section: 'templates', icon: 'fa-rocket' },
    { id: 'consulting-template', title: 'Consulting Firm Template', type: 'Business', section: 'templates', icon: 'fa-briefcase' },
    { id: 'finance-template', title: 'Finance Company Template', type: 'Business', section: 'templates', icon: 'fa-line-chart' },

    // HEALTH & FITNESS
    { id: 'fitness-template', title: 'Fitness Website Template', type: 'Health', section: 'templates', icon: 'fa-heart' },
    { id: 'yoga-template', title: 'Yoga Studio Template', type: 'Health', section: 'templates', icon: 'fa-leaf' },
    { id: 'medical-template', title: 'Medical Clinic Template', type: 'Health', section: 'templates', icon: 'fa-stethoscope' },
    { id: 'wellness-template', title: 'Wellness Center Template', type: 'Health', section: 'templates', icon: 'fa-spa' },

    // TRAVEL
    { id: 'travel-template', title: 'Travel Agency Template', type: 'Travel', section: 'templates', icon: 'fa-plane' },
    { id: 'hotel-template', title: 'Hotel Booking Template', type: 'Travel', section: 'templates', icon: 'fa-hotel' },
    { id: 'tour-template', title: 'Tour Company Template', type: 'Travel', section: 'templates', icon: 'fa-map-signs' },
    { id: 'adventure-template', title: 'Adventure Travel Template', type: 'Travel', section: 'templates', icon: 'fa-binoculars' }

    // Total: 100+ search items across multiple categories!
];

// FIXED: Search function - NO CLOSING WHEN CLICKING ITEMS
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

// FIXED: Display search results - KEEP OPEN WHEN CLICKING ITEMS
function displaySearchResults(results) {
    const resultsContainer = document.getElementById('searchResults');
    
    if (results.length === 0) {
        resultsContainer.innerHTML = '<div class="no-results">No results found</div>';
        resultsContainer.style.display = 'block';
        return;
    }
    
    resultsContainer.innerHTML = results.map(item => `
        <div class="search-result-item" data-section="${item.section}">
            <i class="fa ${item.icon}"></i>
            <span>${item.title}</span>
            <span class="result-type">${item.type}</span>
        </div>
    `).join('');
    
    resultsContainer.style.display = 'block';
    
    // FIXED: Add fresh event listeners - NO CLOSING SEARCH
    document.querySelectorAll('.search-result-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation(); // STOP event from bubbling up
            
            const section = this.getAttribute('data-section');
            
            // DON'T CLOSE ANYTHING - JUST SCROLL
            setTimeout(() => {
                scrollToSection(section);
            }, 100);
        });
    });
}

// FIXED: Scroll function
function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
        });
        
        section.style.transition = 'all 0.5s ease';
        section.style.boxShadow = '0 0 0 2px rgba(255, 213, 76, 0.5)';
        
        setTimeout(() => {
            section.style.boxShadow = 'none';
        }, 2000);
    }
}

// FIXED: Close search only when clicking outside search area
document.addEventListener('click', function(e) {
    const searchContainer = document.querySelector('.search-container');
    const searchResults = document.getElementById('searchResults');
    
    // ONLY close if clicking outside both search container AND search results
    if (!e.target.closest('.search-container') && !e.target.closest('.search-results')) {
        searchResults.style.display = 'none';
    }
});

// Search events
document.getElementById('navSearch').addEventListener('input', performSearch);
document.getElementById('navSearch').addEventListener('click', function(e) {
    e.stopPropagation();
    if (this.value.trim()) {
        performSearch();
    }
});
document.getElementById('navSearch').addEventListener('keyup', function(e) {
    if (e.key === 'Enter') {
        performSearch();
    }
});












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

// Template Filter Functionality
document.addEventListener('DOMContentLoaded', function() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    const templateCards = document.querySelectorAll('.template-card');
    const featuredTemplate = document.querySelector('.featured-template');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all buttons
            filterBtns.forEach(b => b.classList.remove('active'));
            // Add active class to clicked button
            btn.classList.add('active');
            
            const filter = btn.getAttribute('data-filter');
            
            templateCards.forEach(card => {
                const isWeb = card.querySelector('.template-badge:not(.game-badge)');
                const isGame = card.querySelector('.game-badge');
                const priceText = card.querySelector('.template-price').textContent;
                const isFree = priceText.includes('FREE');
                const isPremium = !isFree && !priceText.includes('FREE');

                let shouldShow = false;

                switch(filter) {
                    case 'all':
                        shouldShow = true;
                        break;
                    case 'web':
                        shouldShow = isWeb;
                        break;
                    case 'game':
                        shouldShow = isGame;
                        break;
                    case 'free':
                        shouldShow = isFree;
                        break;
                    case 'premium':
                        shouldShow = isPremium;
                        break;
                }

                if (shouldShow) {
                    card.style.display = 'block';
                    setTimeout(() => {
                        card.style.opacity = '1';
                        card.style.transform = 'translateY(0)';
                    }, 100);
                } else {
                    card.style.opacity = '0';
                    card.style.transform = 'translateY(20px)';
                    setTimeout(() => {
                        card.style.display = 'none';
                    }, 300);
                }
            });

            // Show/hide featured template based on filter
            if (filter === 'all' || filter === 'premium') {
                featuredTemplate.style.display = 'block';
                setTimeout(() => {
                    featuredTemplate.style.opacity = '1';
                }, 100);
            } else {
                featuredTemplate.style.opacity = '0';
                setTimeout(() => {
                    featuredTemplate.style.display = 'none';
                }, 300);
            }
        });
    });
});


