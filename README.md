# The Engineering Log (ByteChat) : A technical journal by Himesh Vats

Welcome to my personal engineering log! This repository contains the source code for my technical blog website, where I write deep-dives into scalable systems, frontend infrastructure, and distributed node networks. 

To elevate the reading experience, I engineered a custom feature called **ByteChat**: an integrated AI assistant built directly into the page. Every article I publish is paired with an AI companion strictly bounded to the logic, context, and code of that specific post.

🔗 **Live Blog:** [doc-ai-chatbot-sigma.vercel.app](https://doc-ai-chatbot-sigma.vercel.app/)

---

## 📺 Project Demonstration

Here is a quick look at how readers can interact with my blog posts (e.g., querying details about shared dependencies inside my "Module Federation & Microfrontend Architecture" article):

<video src="ByteChatDemo.mov" controls="controls" muted="muted" class="d-block rounded-bottom-2 width-fit" style="max-height:640px; min-height: 200px"></video>

*(Note: When you push your video to GitHub, replace the `src` URL above with the actual link to your uploaded file so it renders perfectly on your profile!)*

---

## ✨ Features

* ✍️ **Deep Technical Insights:** A dedicated space where I document complex architectural patterns, complete with structured code blocks and deployment strategies.
* 🧠 **Context-Bounded AI Assistant:** A custom-built chatbot interface (`ByteChat Assistant`) that acts as an expert on the specific post, retrieving accurate answers directly from my written content without hallucinating outside topics.
* 🎨 **Developer-Centric UI:** A clean, scannable dark-themed journal designed for readability, featuring an inline, toggleable chat panel.
* 🌓 **Responsive Theme Switching:** Includes native Light/Dark mode toggling.

---

## 🛠️ Built With

* **Next.js** - React framework for frontend structure and routing.
* **Tailwind CSS** - For responsive, modern UI styling.
* **LLM Integration** - Bounded context/vector retrieval to power the document-specific chatbot assistant.
* **Vercel** - Fast global deployment and hosting.

---

## 🚀 Running Locally

If you want to explore the architecture or run my blog locally:

### Installation

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/himeshvats19/doc-ai-chatbot.git](https://github.com/himeshvats19/doc-ai-chatbot.git)
   cd doc-ai-chatbot