import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 text-gray-800">
      {/* Hero Section */}
      <section className="text-center py-20 px-4 animate-fade-in">
        <h1 className="text-5xl md:text-7xl font-extrabold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-700">
          Visualize Your Ideas
        </h1>
        <p className="text-xl md:text-2xl mb-8 max-w-2xl mx-auto text-gray-600">
          Transform complex paragraphs into beautiful, interactive diagrams with
          ease. Unlock clarity and understanding like never before.
        </p>
        <Link href="/dashboard">
          <div className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full shadow-lg transform transition duration-300 hover:scale-105">
            Start Generating Diagrams
          </div>
        </Link>
      </section>

      {/* Features Section */}
      <section className="w-full max-w-6xl px-4 py-16 bg-white shadow-xl rounded-lg mb-20 animate-slide-up">
        <h2 className="text-4xl font-bold text-center mb-12 text-gray-800">
          Powerful Features
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div className="flex flex-col items-center text-center p-6 bg-blue-50 rounded-lg shadow-md hover:shadow-lg transition duration-300">
            <Image
              src="/file.svg"
              alt="AI Icon"
              width={60}
              height={60}
              className="mb-4"
            />
            <h3 className="text-2xl font-semibold mb-3 text-blue-700">
              AI-Powered Generation
            </h3>
            <p className="text-gray-600">
              Leverage advanced AI to convert your text into structured diagrams
              automatically.
            </p>
          </div>
          <div className="flex flex-col items-center text-center p-6 bg-purple-50 rounded-lg shadow-md hover:shadow-lg transition duration-300">
            <Image
              src="/window.svg"
              alt="Customization Icon"
              width={60}
              height={60}
              className="mb-4"
            />
            <h3 className="text-2xl font-semibold mb-3 text-purple-700">
              Customizable Outputs
            </h3>
            <p className="text-gray-600">
              Fine-tune your diagrams with various themes, layouts, and styling
              options.
            </p>
          </div>
          <div className="flex flex-col items-center text-center p-6 bg-green-50 rounded-lg shadow-md hover:shadow-lg transition duration-300">
            <Image
              src="/globe.svg"
              alt="Export Icon"
              width={60}
              height={60}
              className="mb-4"
            />
            <h3 className="text-2xl font-semibold mb-3 text-green-700">
              Easy Export & Share
            </h3>
            <p className="text-gray-600">
              Export your diagrams in multiple formats and share them
              effortlessly with your team.
            </p>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="text-center py-16 px-4 bg-blue-700 text-white w-full animate-fade-in-up">
        <h2 className="text-4xl font-bold mb-4">Ready to Visualize?</h2>
        <p className="text-xl mb-8 max-w-2xl mx-auto">
          Join thousands of users who are simplifying their complex ideas with
          our intuitive diagram generator.
        </p>
        <Link href="/dashboard">
          <div className="bg-white hover:bg-gray-100 text-blue-700 font-bold py-3 px-8 rounded-full shadow-lg transform transition duration-300 hover:scale-105">
            Get Started Now
          </div>
        </Link>
      </section>

      {/* Footer */}
      <footer className="w-full text-center py-8 bg-gray-800 text-gray-300 text-sm">
        <p>
          &copy; {new Date().getFullYear()} Diagram Generator. All rights
          reserved.
        </p>
      </footer>
    </div>
  );
}
