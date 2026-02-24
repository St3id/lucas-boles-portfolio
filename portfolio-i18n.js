(function () {
    const languageButtons = document.querySelectorAll(".lang-btn");
    if (!languageButtons.length) {
        return;
    }

    const storageKey = "portfolio-language";
    let currentLanguage = "fr";

    const helperText = {
        fr: {
            projectModalDownloadDefault: "Télécharger le document (PDF)",
            projectGalleryViewLabel: "vue",
            projectCardAriaLabel: "Ouvrir les détails du projet",
            objectiveCardAriaLabel: "Ouvrir les détails de l'objectif"
        },
        en: {
            projectModalDownloadDefault: "Download the document (PDF)",
            projectGalleryViewLabel: "view",
            projectCardAriaLabel: "Open project details",
            objectiveCardAriaLabel: "Open objective details"
        }
    };

    window.getPortfolioText = function getPortfolioText(key) {
        const dictionary = helperText[currentLanguage] || helperText.fr;
        if (Object.prototype.hasOwnProperty.call(dictionary, key)) {
            return dictionary[key];
        }
        return helperText.fr[key] || "";
    };

    const textBindings = [
        {
            selector: "#nav-list a",
            en: ["About", "Projects", "Objectives", "FAQ", "Contact"]
        },
        {
            selector: ".hero-description",
            en: [
                "Passionate about industrial automation and system optimization, I build my technical skills through concrete projects and varied experiences. My internships at CEA and CNRS strengthened my rigor and professionalism, while my company experience improved versatility and adaptability.",
                "Always curious to explore new technologies, I currently dedicate time to learning ADA, a robust language used in critical and embedded systems, fully aligned with my career goals in industrial automation."
            ]
        },
        {
            selector: ".info-item strong",
            en: ["Crolles, Isère (38)", "BUT GEII Year 2", "Driving License B", "English C1"]
        },
        {
            selector: ".key-stats .stat-number",
            en: ["BUT GEII Y2", "AII", "Work-study 2026"]
        },
        {
            selector: ".key-stats .stat-label",
            en: ["Current Program", "Track", "Seeking position"]
        },
        {
            selector: ".tabs-buttons .tab-btn",
            en: ["Skills", "Interests", "Soft Skills"]
        },
        {
            selector: "#compete-content .skill-category h3",
            en: ["💻 Programming", "⚙️ Automation", "🛠️ Tools"]
        },
        {
            selector: "#compete-content .skill-level",
            en: [
                "Proficient",
                "Proficient",
                "Proficient",
                "In progress",
                "Learning",
                "Proficient",
                "HMI",
                "Hands-on",
                "Mastered",
                "Electronic CAD",
                "Proficient",
                "Hands-on"
            ]
        },
        {
            selector: "#passions-content .passion-content h4",
            en: ["Continuous Learning", "Climbing", "Volleyball", "Diving", "Love for the Mountains"]
        },
        {
            selector: "#passions-content .passion-content p",
            en: [
                "Always exploring new languages and tools (currently ADA)",
                "Grade 7A - A sport combining strength, technique, and mindset",
                "Team spirit and energy on the court",
                "PADI Open Water certified - Exploring underwater environments",
                "Hikes, landscapes and fresh air - my source of escape and balance"
            ]
        },
        {
            selector: "#softskills-content .soft-category h3",
            en: ["🤝 Personal Strengths"]
        },
        {
            selector: "#softskills-content .soft-item span:first-child",
            en: ["Rigor & Professionalism", "Versatility & Adaptability", "Technical Curiosity", "Team Spirit", "Perseverance"]
        },
        {
            selector: "#softskills-content .soft-level",
            en: ["Developed at CEA/CNRS", "Diverse experiences", "Continuous learning", "Team sports", "Mental strength from sport"]
        },
        {
            selector: "#moi .cta-button",
            en: ["View my projects", "Contact me"]
        },
        {
            selector: "#projets h2",
            en: ["Projects & Experience"]
        },
        {
            selector: "#projets .project-date",
            en: ["October 2025", "2024 - 2025", "August 2022", "April 2021", "Ongoing", "August 2024"]
        },
        {
            selector: "#projets .project-title",
            en: [
                "Automated Rail Transfer System",
                "Line Following Robot",
                "Internship at CEA Grenoble",
                "Internship at CNRS Grenoble",
                "Technology Monitoring & Continuous Learning",
                "Production Operator - SDMR"
            ]
        },
        {
            selector: "#projets .project-description",
            mode: "html",
            en: [
                "Design of a two-cart automated system for transferring baskets between chemical treatment tanks. Functional analysis, GRAFCET diagrams, alarm management, and drive control. PLC programming with Schneider Control Expert and Vijeo Designer HMI. Simulation and bench testing.",
                "Worked from a complete specification to design an autonomous robot. Proficient use of KiCad for circuit design, CAD software, soldering, testing, embedded programming, and preparation of technical documentation.",
                "Contributed across several scientific departments (nuclear, medical, and biological). Observed safety practices and information protection. Worked independently, took part in English-speaking sessions, and maintained strong attention to detail.",
                "Cultivation of bacteria and yeast, DNA extraction, and introduction to crystallography. Strengthened professionalism, sense of responsibility, and precision in scientific lab work.",
                "Always seeking new intellectual challenges, I dedicate part of my time to exploring new languages and tools. Currently, I am improving in <strong>ADA</strong> to deepen my knowledge of secure and robust system programming and strengthen my technical versatility.",
                "Machine operation, handling, packaging, sorting, quality control, non-conformity management, and palletizing in a food distribution company. Developed adaptability and a strong work pace."
            ]
        },
        {
            selector: "#projets .project-tags .tag",
            en: [
                "Control Expert",
                "Vijeo Designer",
                "Grafcet",
                "Schneider PLC",
                "KiCad",
                "Arduino",
                "C/C++",
                "Electronics",
                "CAD",
                "Scientific research",
                "Nuclear",
                "Security",
                "English",
                "Biology",
                "Laboratory",
                "Crystallography",
                "DNA",
                "ADA",
                "Learning",
                "Technology monitoring",
                "Systems",
                "Production",
                "Quality",
                "Versatility"
            ]
        },
        {
            selector: "#project-modal-download",
            en: ["Download the document (PDF)"]
        },
        {
            selector: "#projections h2",
            en: ["Objectives"]
        },
        {
            selector: "#projections .timeline-date",
            en: ["Mid-April 2026", "2027", "2027-2029", "2028-2030", "Long term"]
        },
        {
            selector: "#projections .timeline-title",
            en: [
                "Internship in Industrial Automation",
                "BUT GEII Diploma",
                "Specialization or Engineering School",
                "International Technical Expertise",
                "Innovation & Leadership"
            ]
        },
        {
            selector: "#projections .timeline-description",
            en: [
                "Actively looking for an 8 to 12-week internship in industrial automation to apply my skills in PLC programming, Control Expert, and automated systems. I aim to contribute to concrete production optimization projects.",
                "Earn my BUT Electrical Engineering & Industrial Computing degree with a specialization in Automation & Industrial Computing. Deepen my knowledge of embedded systems, industrial networks, and supervision.",
                "Continue my studies in engineering school or a specialized master's program in automation, robotics, or embedded systems. Goal: become an automation engineer and contribute to Industry 4.0.",
                "Develop expertise in complex automated systems and work on international projects. Use my language skills to collaborate with multicultural teams.",
                "Contribute to innovation in industrial automation, take part in R&D projects, and potentially lead technical teams. Stay curious and continuously monitor AI applications in industry."
            ]
        },
        {
            selector: "#faq h2",
            en: ["FAQ"]
        },
        {
            selector: "#faq .faq-question",
            en: [
                "What work-study position are you looking for?",
                "Which technologies are you already proficient in?",
                "What kinds of projects would you like to work on?",
                "Are you open to relocating within France?",
                "What is the fastest way to contact you?"
            ]
        },
        {
            selector: "#faq .faq-answer",
            en: [
                "I am looking for a work-study position focused on industrial automation: PLC programming, HMI supervision, commissioning, and process improvement.",
                "I use Control Expert, Vijeo Designer, Grafcet, Python, C, and Arduino. I am also actively learning ADA.",
                "Priority on concrete industrial projects: line automation, equipment control, reliability, functional safety, and production optimization.",
                "Yes. I am based in Crolles (Isère) and can consider relocation depending on the opportunity, project, and work-study schedule.",
                "The easiest way is through this site's contact section: personal email, university email, phone, and LinkedIn."
            ]
        },
        {
            selector: "#liens h2",
            en: ["Contact Me"]
        },
        {
            selector: "#liens .link-title",
            en: ["Personal Email", "University Email", "Phone", "LinkedIn", "Download my CV", "Location"]
        },
        {
            selector: "#liens .link-description",
            en: [
                "boleslcc@gmail.com",
                "lucas.boles@etu.univ-grenoble-alpes.fr",
                "06 70 15 03 29",
                "linkedin.com/lucas-boles",
                "PDF version",
                "Crolles (38920), Isère - France"
            ]
        },
        {
            selector: "footer > p:first-child",
            en: ["© 2026 Lucas BOLES - BUT GEII Student - Passionate about industrial automation"]
        },
        {
            selector: ".footer-subtext",
            en: ["Available for a 2026 work-study position"]
        },
        {
            selector: ".footer-legal-link",
            en: ["Legal Notice"]
        },
        {
            selector: ".game-launch-kicker",
            en: ["Gaming"]
        },
        {
            selector: "#game-launch-title",
            en: ["Competition, teamwork, self-improvement"]
        },
        {
            selector: "#game-launch .game-launch-line",
            en: [
                "Video games have shaped my competitive mindset and my drive to always push further.",
                "I have always enjoyed all kinds of video games, but I am especially drawn to team-vs-team games.",
                "Favorite titles:",
                "I could not build a portfolio without showing this side of me, so here is a small Minesweeper game to pass the time."
            ]
        },
        {
            selector: ".game-launch-foot",
            en: ["Read at your own pace, then confirm when you want to start Minesweeper."]
        },
        {
            selector: "#game-launch-confirm",
            en: ["Confirm and Play"]
        }
    ];

    const attrBindings = [
        {
            selector: 'meta[name="description"]',
            attr: "content",
            en: ["Portfolio of Lucas BOLES, BUT GEII student (AII track), looking for a 2026 work-study position in automation and industrial computing."]
        },
        {
            selector: 'meta[property="og:locale"]',
            attr: "content",
            en: ["en_US"]
        },
        {
            selector: 'meta[property="og:description"]',
            attr: "content",
            en: ["BUT GEII student (AII track), looking for a 2026 work-study position in automation and industrial computing."]
        },
        {
            selector: 'meta[name="twitter:description"]',
            attr: "content",
            en: ["BUT GEII student, looking for a 2026 work-study position in automation and industrial computing."]
        },
        {
            selector: ".lang-switch",
            attr: "aria-label",
            en: ["Choose a language"]
        },
        {
            selector: ".cv-nav-link",
            attr: "title",
            en: ["Download my CV"]
        },
        {
            selector: ".game-button",
            attr: "title",
            en: ["Play Minesweeper"]
        },
        {
            selector: ".typing-text",
            attr: "data-text",
            en: ["Electrical Engineering and Industrial Computing Student"]
        },
        {
            selector: ".info-item a",
            attr: "title",
            en: ["View on Google Maps"]
        },
        {
            selector: ".info-item span[title]",
            attr: "title",
            en: ["Automation & Industrial Computing", "Bright Language certification (2025) and TOEIC 885/990 (2026)"]
        },
        {
            selector: "#project-modal-close",
            attr: "aria-label",
            en: ["Close dialog"]
        },
        {
            selector: "#objective-modal-close",
            attr: "aria-label",
            en: ["Close dialog"]
        },
        {
            selector: "#game-launch-favs",
            attr: "aria-label",
            en: ["Favorite video games"]
        },
        {
            selector: "#projets .project-card:first-child",
            attr: "data-modal-details",
            en: ["Functional analysis excerpts (version K - 10/25/2025): GRAFCET architecture (Operation, GARU, INIT, and production cycles), safety/E-stop management, and global initialization logic. Tools used: Schneider EcoStruxure Control Expert V15.3 and Vijeo Designer 6.3, with position sensors and Ladder routines."]
        },
        {
            selector: "#projets .project-card:first-child",
            attr: "data-modal-file-label",
            en: ["Download the functional analysis (PDF)"]
        },
        {
            selector: "#projets .project-card",
            attr: "aria-label",
            en: "Open project details"
        },
        {
            selector: "#projections .timeline-content",
            attr: "aria-label",
            en: "Open objective details"
        }
    ];

    const originalTextValues = textBindings.map(binding => {
        return Array.from(document.querySelectorAll(binding.selector)).map(node => {
            return binding.mode === "html" ? node.innerHTML : node.textContent;
        });
    });

    const originalAttrValues = attrBindings.map(binding => {
        return Array.from(document.querySelectorAll(binding.selector)).map(node => node.getAttribute(binding.attr) || "");
    });

    function applyText(binding, values) {
        const nodes = document.querySelectorAll(binding.selector);
        nodes.forEach((node, index) => {
            const value = Array.isArray(values) ? values[index] : values;
            if (typeof value === "string") {
                if (binding.mode === "html") {
                    node.innerHTML = value;
                } else {
                    node.textContent = value;
                }
            }
        });
    }

    function applyAttr(binding, values) {
        const nodes = document.querySelectorAll(binding.selector);
        nodes.forEach((node, index) => {
            const value = Array.isArray(values) ? values[index] : values;
            if (typeof value === "string") {
                node.setAttribute(binding.attr, value);
            }
        });
    }

    function updateButtons() {
        languageButtons.forEach(button => {
            const isActive = button.getAttribute("data-lang") === currentLanguage;
            button.classList.toggle("active", isActive);
            button.setAttribute("aria-pressed", isActive ? "true" : "false");
        });
    }

    function applyLanguage(language, options) {
        const settings = options || {};
        currentLanguage = language === "en" ? "en" : "fr";
        const isEnglish = currentLanguage === "en";

        document.documentElement.setAttribute("lang", isEnglish ? "en" : "fr");

        textBindings.forEach((binding, index) => {
            applyText(binding, isEnglish ? binding.en : originalTextValues[index]);
        });

        attrBindings.forEach((binding, index) => {
            applyAttr(binding, isEnglish ? binding.en : originalAttrValues[index]);
        });

        const typingNode = document.querySelector(".typing-text");
        if (typingNode) {
            if (typeof window.stopTypeWriter === "function") {
                window.stopTypeWriter(typingNode, true);
            }

            if (settings.animateTyping && typeof window.typeWriter === "function") {
                window.typeWriter(typingNode);
            } else {
                typingNode.textContent = typingNode.getAttribute("data-text") || "";
            }
        }

        updateButtons();

        if (settings.persist !== false) {
            try {
                localStorage.setItem(storageKey, currentLanguage);
            } catch (error) {
                // Ignore storage failures when unavailable.
            }
        }
    }

    languageButtons.forEach(button => {
        button.addEventListener("click", () => {
            applyLanguage(button.getAttribute("data-lang"), { persist: true, animateTyping: true });
        });
    });

    let initialLanguage = "fr";
    try {
        const storedLanguage = localStorage.getItem(storageKey);
        if (storedLanguage === "en" || storedLanguage === "fr") {
            initialLanguage = storedLanguage;
        }
    } catch (error) {
        initialLanguage = "fr";
    }

    applyLanguage(initialLanguage, { persist: false, animateTyping: false });
})();
