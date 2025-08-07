import edward from "../images/mine/edward.jpg";
import cosplay from "../images/mine/cosplay.jpg";
import editorial from "../images/mine/editorial.jpg";
import physique from "../images/mine/physique.jpg";
import portrait from "../images/mine/portrait.jpg";
import architecture from "../images/mine/architecture.jpg";
import wildlife from "../images/mine/wildlife.jpg";

// Sample screenshots (replace with actual images or leave empty for now)
import brainstorm1 from "../images/projects/brainstorm1.png";
import brainstorm2 from "../images/projects/brainstorm2.png";

import imoogiLogo from "../images/startups/imoogi.png";
import innerlightLogo from "../images/startups/innerlight.png";
import quillinoLogo from "../images/startups/quillino.png"; // If you want to use it later


export const profile = {
    name: "Edward Tang",
    role: "Full-Stack Developer & AI Enthusiast",
    photo: edward,
    bio: `With a Diploma in Biomedical Engineering with Merit, I am focused on applying AI to solve real-world healthcare challenges. My background combines technical knowledge with creative insight from photography, enabling me to design solutions that are both innovative and human-centered.`,
    tools: [
        "React",
        "Python",
        "OpenCV",
        "Node.js",
        "TensorFlow",
        "Figma",
        "Docker",
        "Google Cloud"
    ]
};

export const projects = [
    {
        title: "💡 Brainstorm.io",
        status: "UX & AI Tooling",
        statusClass: "active",
        description:
            "An AI-powered brainstorming web app to help users ideate faster and deeper using multiple generation modes and visual mind-mapping.",
        images: [brainstorm1, brainstorm2],
    },
    {
        title: "🏥 Elderly Medical Pill Tracking",
        status: "Computer Vision",
        statusClass: "active",
        description:
            "Developed a CV-based system to help elderly patients track their medication intake using image recognition.",
        images: [],
    },
    {
        title: "🏥 Changi General Hospital Platform",
        status: "Web Development",
        statusClass: "active",
        description:
            "Led the Version 2.0 of the hospital scheduling system, focusing on intern experience and healthcare workflows.",
        images: [],
    },
    {
        title: "🐦 Bird Identification App",
        status: "Mobile App",
        statusClass: "active",
        description:
            "Created a machine learning-based app to identify bird species through photography.",
        images: [],
    },
    {
        title: "🎭 Deepfake Detection using CViT",
        status: "AI Research",
        statusClass: "active",
        description:
            "Built a Vision Transformer model for identifying deepfake media with high accuracy.",
        images: [],
    },
    {
        title: "🏦 Service Design Studio - DBS",
        status: "Team Project",
        statusClass: "active",
        description:
            "Partnered with DBS to reimagine customer experience through service design and digital UX.",
        images: [],
    },
];

export const photoGallery = [
    { title: "Cosplay", image: cosplay },
    { title: "Editorial", image: editorial },
    { title: "Physique", image: physique },
    { title: "Portrait", image: portrait },
    { title: "Architecture", image: architecture },
    { title: "Wildlife", image: wildlife },
];

export const startups = {
    current: [
        {
            name: "🧠 Cortex Lab",
            status: "active",
            logo: quillinoLogo,
            link: "https://cortexlabs.tech/",
            description:
                "Cutting-edge AI lab building next-gen intelligent systems with a focus on education and healthcare.",
        },
        {
            name: "📸 Ed/이무기 Studio",
            status: "active",
            logo: imoogiLogo,
            link: "https://edlenscraft.myportfolio.com/",
            description:
                "Creative photography studio specializing in portraits, cosplay, editorial and fitness work.",
        },
        {
            name: "✨ Inner Light",
            status: "active",
            logo: innerlightLogo,
            link: "https://www.linkedin.com/company/inner-light-management/",
            description:
                "Modeling and events agency empowering individuals to shine through coaching and curated experiences.",
        },
    ],
    previous: [
        {
            name: "🎥 Latcher AI",
            status: "planning",
            description:
                "CCTV AI surveillance solution focused on intelligent activity recognition and monitoring.",
        },
        {
            name: "🏗️ Facade Cleaner",
            status: "planning",
            description:
                "Robotic cleaning system for building facades using Raspberry Pi and computer vision.",
        },
        {
            name: "🩺 GlucoRing",
            status: "planning",
            description:
                "Non-invasive continuous glucose monitoring device using microwave sensing and signal analysis.",
        },
    ],
};

export const skills = [
    {
        category: "Frontend Development",
        tags: ["React", "JavaScript", "TypeScript", "CSS3", "HTML5", "Vue.js"],
    },
    {
        category: "Backend Development",
        tags: ["Node.js", "Python", "PHP", "MySQL", "MongoDB", "REST APIs"],
    },
    {
        category: "AI & Computer Vision",
        tags: [
            "OpenCV",
            "TensorFlow",
            "PyTorch",
            "Computer Vision",
            "Machine Learning",
            "CViT",
        ],
    },
    {
        category: "Hardware & IoT",
        tags: [
            "Raspberry Pi",
            "Arduino",
            "IoT Sensors",
            "Embedded Systems",
            "Hardware Integration",
        ],
    },
];
