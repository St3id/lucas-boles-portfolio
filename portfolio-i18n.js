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
            en: ["About", "My Projects", "Goals", "FAQ", "Contact"]
        },
        {
            selector: ".hero-description",
            mode: "html",
            en: [
                "Passionate about <strong>industrial automation</strong> and <strong>system optimization</strong>, I develop my skills through projects and diverse experiences. My internships at <strong>CEA</strong> and <strong>CNRS</strong> in particular helped me build rigor and professionalism, while my company experience strengthened my versatility and adaptability.",
                "Always curious to explore new technological horizons, I am currently dedicating time to learning <strong>ADA</strong>, a robust language used in <strong>critical and embedded systems</strong>, an area that perfectly matches my professional goals in industrial automation."
            ]
        },
        {
            selector: ".info-item strong",
            en: ["Crolles, Isère (38)", "GEII BUT - Year 2", "Driving License B", "English C1"]
        },
        {
            selector: ".key-stats .stat-number",
            en: ["GEII BUT Y2", "AII", "Work-study 2026"]
        },
        {
            selector: ".key-stats .stat-label",
            en: ["Current Program", "Track", "Seeking"]
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
            selector: "#compete-content .skill-item > span:first-child",
            en: [
                "Python",
                "C",
                "Arduino",
                "HTML",
                "Java",
                "ADA",
                "Control Expert",
                "TIA Portal",
                "Vijeo Designer",
                "Schneider PLCs",
                "Siemens PLCs",
                "KiCad",
                "Microsoft Office",
                "CAD Software"
            ]
        },
        {
            selector: "#compete-content .skill-level",
            en: [
                "90%",
                "80%",
                "80%",
                "70%",
                "60%",
                "50%",
                "90%",
                "80%",
                "80%",
                "90%",
                "70%",
                "80%",
                "90%",
                "70%"
            ]
        },
        {
            selector: "#passions-content .passion-content h4",
            en: ["Continuous Learning", "Climbing", "Volleyball", "Scuba Diving", "The Mountains"]
        },
        {
            selector: "#passions-content .passion-content p",
            en: [
                "Always looking for new languages and tools (currently ADA).",
                "7A bouldering level - A sport that combines strength, technique, and mindset.",
                "Team spirit and energy on the court.",
                "PADI Open Water certified.",
                "Hikes, landscapes, and group outings: a real pleasure."
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
            en: ["Developed at CEA/CNRS", "Diverse experiences", "Continuous learning", "Team sports", "Mindset & Sport"]
        },
        {
            selector: "#moi .cta-button",
            en: ["View my projects", "Contact me"]
        },
        {
            selector: "#projets h2",
            en: ["My Projects & Experience"]
        },
        {
            selector: "#projets .project-date",
            en: ["October 2025", "2024 - 2025", "August 2022", "April 2021", "Ongoing", "August 2024"]
        },
        {
            selector: "#projets .project-title",
            en: [
                "Automated Rail Transfer System",
                "Line-Following Robot",
                "CEA Grenoble Internship",
                "CNRS Grenoble Internship",
                "Technology Watch & Continuous Learning",
                "Production Operator - SDMR"
            ]
        },
        {
            selector: "#projets .project-description",
            mode: "html",
            en: [
                "Design of a <strong>two-cart automated system</strong> to transfer baskets between chemical-treatment tanks. <strong>Functional analysis</strong>, GRAFCETs, alarm and drive management. <strong>Programming on Schneider PLC</strong> (Control Expert) and Vijeo Designer HMI. Simulation and bench testing. Project carried out within the <a href=\"https://iut1.univ-grenoble-alpes.fr/\" target=\"_blank\" rel=\"noopener noreferrer\">GEII BUT program at IUT1 Grenoble</a>.",
                "Execution of a <strong>complete specification</strong> for the design of an autonomous robot. Proficient use of KiCad for circuit design, CAD software, soldering, testing, <strong>embedded programming</strong>, and preparation of technical documentation. Project completed <a href=\"https://iut1.univ-grenoble-alpes.fr/\" target=\"_blank\" rel=\"noopener noreferrer\">at IUT1 Grenoble</a>.",
                "I completed an internship at <strong>CEA Grenoble</strong>, a technology research center where energy, health, digital, and security fields meet. This immersion taught me to work methodically in a demanding environment, with strong confidentiality and scientific information quality standards. <a href=\"https://www.cea.fr/Pages/le-cea/les-centres-cea/grenoble.aspx\" target=\"_blank\" rel=\"noopener noreferrer\">Discover CEA Grenoble</a>.",
                "My internship at <strong>CNRS Grenoble</strong> introduced me to public research labs and their experimental rigor standards. Through biological manipulations and precision work, I reinforced my discipline, traceability practices, and sense of responsibility. <a href=\"https://www.grenoble.cnrs.fr/\" target=\"_blank\" rel=\"noopener noreferrer\">Discover CNRS Grenoble</a>.",
                "I continuously develop my technical culture around <strong>Ada</strong>, known for robustness in critical and embedded systems. This learning helps me structure code that is more reliable, readable, and maintainable over time. <a href=\"https://ada-lang.io/\" target=\"_blank\" rel=\"noopener noreferrer\">Learn more about Ada</a>.",
                "My experience at <strong>SDMR</strong> immersed me in the real pace of a food-production environment: machine operations, quality control, and non-conformity management. It strengthened my versatility, field responsiveness, and ability to maintain a consistent level of quality in a team. <a href=\"https://sdmr-marcel-recorbet.com\" target=\"_blank\" rel=\"noopener noreferrer\">View company profile</a>."
            ]
        },
        {
            selector: "#projets .project-tags .tag",
            en: [
                "Control Expert",
                "Vijeo Designer",
                "GRAFCET",
                "Schneider PLC",
                "KiCad",
                "Arduino",
                "C/C++",
                "Electronics",
                "CAD",
                "Scientific Research",
                "Nuclear",
                "Safety",
                "English",
                "Biology",
                "Laboratory",
                "Crystallography",
                "DNA",
                "ADA",
                "Learning",
                "Tech Watch",
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
            en: ["My Goals"]
        },
        {
            selector: "#projections .timeline-date",
            en: ["Mid-April 2026", "2027", "2027-2029", "2028-2030", "Long term"]
        },
        {
            selector: "#projections .timeline-title",
            en: [
                "Internship at Waga Energy",
                "GEII BUT Degree",
                "Specialization or Engineering School",
                "International Technical Expertise",
                "Innovation & Leadership"
            ]
        },
        {
            selector: "#projections .timeline-description",
            mode: "html",
            en: [
                "Internship confirmed at <strong>Waga Energy</strong> in Eybens (EIA department) for 11 weeks and 2 days. I will contribute to the commissioning of PROFINET interfaces and the writing of technical documentation.",
                "Earn my <strong>GEII BUT (Electrical Engineering & Industrial Computing)</strong> degree with a specialization in <strong>Automation & Industrial Computing</strong>. Deepen my knowledge in embedded systems, industrial networks, and supervision.",
                "Continue my studies in an <strong>engineering school</strong> or a specialized master's program in automation, robotics, or embedded systems. Goal: become an <strong>automation engineer</strong> and contribute to Industry 4.0.",
                "Develop <strong>expertise in complex automated systems</strong> and work on international projects. Use my language skills to collaborate with multicultural teams.",
                "Contribute to <strong>innovation in industrial automation</strong>, participate in R&D projects, and potentially lead technical teams. Stay curious with continuous <strong>technology watch</strong> on AI applied to industry."
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
                "Which technologies do you already master?",
                "What types of projects would you like to work on?",
                "Are you mobile in France?",
                "How can someone contact you quickly?"
            ]
        },
        {
            selector: "#faq .faq-answer",
            en: [
                "I am looking for a work-study position focused on industrial automation: PLC programming, HMI supervision, commissioning, and process improvement.",
                "I use Control Expert, Vijeo Designer, GRAFCET, Python, C, and Arduino. I am also actively learning ADA.",
                "Priority goes to concrete industrial projects: line automation, equipment control, reliability, functional safety, and production optimization.",
                "Yes. I am based in Crolles (Isère) and can consider mobility depending on the opportunity, project, and work-study schedule.",
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
            en: ["© 2026 Lucas BOLES - GEII BUT Student - Passionate about industrial automation"]
        },
        {
            selector: ".footer-subtext",
            en: ["Available for a work-study position in 2026"]
        },
        {
            selector: ".footer-legal-link",
            en: ["Legal Notice"]
        },
        {
            selector: ".game-launch-kicker",
            en: ["Transferable Skills"]
        },
        {
            selector: "#game-launch-title",
            en: ["Video games, teamwork, and performance"]
        },
        {
            selector: "#game-launch .game-launch-line",
            en: [
                "Competitive games taught me to quickly analyze a situation, keep a cool head, and make decisions under pressure.",
                "Team-versus-team formats strengthened my communication, coordination, and ability to hold a role in service of a shared objective.",
                "Games that most shaped this mindset:",
                "I wanted to reflect this side in my portfolio: this Minesweeper is a playful break, with the same logic of progress and efficiency."
            ]
        },
        {
            selector: ".game-launch-foot",
            en: ["Read at your own pace, then confirm when you want to launch Minesweeper."]
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
            en: ["Portfolio of Lucas BOLES, GEII BUT student (AII track), seeking a 2026 work-study position in automation and industrial computing."]
        },
        {
            selector: 'meta[property="og:locale"]',
            attr: "content",
            en: ["en_US"]
        },
        {
            selector: 'meta[property="og:description"]',
            attr: "content",
            en: ["GEII BUT student (AII track), seeking a 2026 work-study position in automation and industrial computing."]
        },
        {
            selector: 'meta[name="twitter:description"]',
            attr: "content",
            en: ["GEII BUT student, seeking a 2026 work-study position in automation and industrial computing."]
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
            en: ["Automation & Industrial Computing", "Bright Language certified in 2025 and TOEIC 885/990 in 2026"]
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
            en: ["Extracts from the functional analysis (version K - 10/25/2025): GRAFCET architecture (Operation, GARU, INIT, and production cycles), safety/E-stop management, and global initialization logic. Tools used: Schneider EcoStruxure Control Expert V15.3 and Vijeo Designer 6.3, with position sensors and Ladder routines."]
        },
        {
            selector: "#projets .project-card:first-child",
            attr: "data-modal-file-label",
            en: ["Download the functional analysis (PDF)"]
        },
        {
            selector: "#projets .project-card:nth-child(3)",
            attr: "data-modal-details",
            en: [
                "At CEA Grenoble, I discovered an applied research environment where projects include low-carbon energy, health, digital technologies, and security. My internship exposed me to demanding working methods: confidentiality, traceability, protocol compliance, and clear technical communication. This experience strengthened my professional rigor and my ability to work autonomously in a scientific setting."
            ]
        },
        {
            selector: "#projets .project-card:nth-child(4)",
            attr: "data-modal-details",
            en: [
                "CNRS is a multidisciplinary national research organization. During my internship in Grenoble, I took part in lab manipulations (microbial culture, DNA extraction, initial crystallography notions) with strong precision and reproducibility requirements. This experience taught me to properly document each step and apply the quality standards expected in research."
            ]
        },
        {
            selector: "#projets .project-card:nth-child(5)",
            attr: "data-modal-details",
            en: [
                "Ada is a language historically designed for robust and safe systems, used in contexts where software reliability is essential. My objective is to complement my foundations in automation and industrial programming with stricter software quality practices: strong typing, readability, long-term maintainability, and error prevention from the design stage."
            ]
        },
        {
            selector: "#projets .project-card:nth-child(6)",
            attr: "data-modal-details",
            en: [
                "At SDMR, I worked on production and packaging flow in a food-industry context. Assigned tasks combined machine operation, quality checks, non-conformity handling, and end-of-line logistics. This experience gave me concrete field reflexes: pace management, execution reliability, team coordination, and rapid adaptation."
            ]
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
        },
        {
            selector: "#projections .timeline-item:first-child .timeline-content",
            attr: "data-modal-details",
            en: [
                "This internship takes place at Waga Energy in Eybens, within the EIA department. The company specializes in biomethane production from landfill gas through its WAGABOX technology. My mission fits this industrial context: support the commissioning of new PROFINET interfaces for Emerson vibration sensors, from wiring and configuration to validation tests, then write a clear user guide to support future projects. Planned duration: 11 weeks and 2 days."
            ]
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
