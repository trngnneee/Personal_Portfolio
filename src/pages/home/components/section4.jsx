import { Element } from "react-scroll";
import { Title } from "../../../components/title";
import { useEffect, useState } from "react";
import { FaEnvelope, FaPhone, FaLinkedinIn, FaFacebookF, FaCopy, FaGithub, FaInstagram } from "react-icons/fa";
import JustValidate from 'just-validate';
import emailjs from "emailjs-com";
import { toast } from "sonner";


export const Section4 = () => {
  const [copied, setCopied] = useState(false);
  const [copied1, setCopied1] = useState(false);

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setTimeout(() => setCopied(false), 2000);
  };

  const service = [
    {
      value: "Frontend Development",
      label: "Frontend Development"
    },
    {
      value: "Backend Development",
      label: "Backend NodeJs Development"
    },
    {
      value: "Consulting",
      label: "Consulting"
    },
    {
      value: "Other",
      label: "Other"
    }
  ]

  useEffect(() => {
    const validation = new JustValidate('#contact-form');
    validation
      .addField('#name', [
        { rule: 'required', errorMessage: 'Name is required' },
        { rule: 'minLength', value: 3, errorMessage: 'Name must be at least 3 characters' },
        { rule: 'maxLength', value: 30, errorMessage: 'Name must be less than 30 characters' },
      ])
      .addField('#email', [
        { rule: 'required', errorMessage: 'Email is required' },
        { rule: 'email', errorMessage: 'Email is invalid' },
        { rule: 'maxLength', value: 50, errorMessage: 'Email must be less than 50 characters' },
      ])
      .addField('#subject', [
        { rule: 'required', errorMessage: 'Subject is required' },
        { rule: 'minLength', value: 3, errorMessage: 'Subject must be at least 3 characters' },
        { rule: 'maxLength', value: 100, errorMessage: 'Subject must be less than 100 characters' },
      ])
      .addField('#message', [
        { rule: 'required', errorMessage: 'Message is required' },
        { rule: 'minLength', value: 10, errorMessage: 'Message must be at least 10 characters' },
        { rule: 'maxLength', value: 500, errorMessage: 'Message must be less than 500 characters' },
      ])
      .onSuccess((event) => {
        event.preventDefault();
        const promise = emailjs
          .sendForm(
            import.meta.env.VITE_SERVICE_ID,
            import.meta.env.VITE_TEMPLATE_ID,
            document.getElementById("contact-form"),
            import.meta.env.VITE_PUBLIC_KEY
          )
          .then(
            () => {
              document.getElementById("contact-form").reset();
            },
            (error) => {
            }
          );
        
        toast.promise(promise, {
          loading: 'Sending...',
          success: 'Message sent successfully!',
          error: 'Failed to send message. Please try again later.'
        });
      });
  }, []);

  return (
    <>
      <Element id="contact" className="container mx-auto px-[95px] mb-[100px]">
        <div className="flex flex-col items-center pt-[50px]">
          <Title
            title={"Contact me"}
            subTitle={"I'm always open to discussing new projects, creative ideas, or opportunities to be part of your visions. Feel free to reach out!"}
          />

          <div className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="bg-[#ffffff10] p-8 rounded-xl shadow-lg border border-[#1e2230]">
              <h2 className="text-2xl font-semibold text-[#CECECE] mb-6">Send Message</h2>

              <form id="contact-form" className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-400">Full Name *</label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      placeholder="Enter your full name"
                      className="w-full mt-1 p-3 bg-[#ffffff10] border border-[#1e2230] rounded-lg text-sm text-gray-300 focus:outline-none focus:border-[#CECECE] hover:scale-[1.02]"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Email *</label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="Enter your email"
                      className="w-full mt-1 p-3 bg-[#ffffff10] border border-[#1e2230] rounded-lg text-sm text-gray-300 focus:outline-none focus:border-[#CECECE] hover:scale-[1.02]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm text-gray-400">Service of Interest</label>
                  <select
                    className="w-full mt-1 p-3 bg-[#ffffff10] border border-[#1e2230] rounded-lg text-sm text-gray-300 focus:outline-none focus:border-[#CECECE] hover:scale-[1.02]"
                    defaultValue=""
                    id="service"
                    name="service"
                  >
                    <option className="text-black" value="">Select service</option>
                    {service.map((item, index) => (
                      <option
                        className="text-black"
                        key={index}
                        value={item.value}
                      >
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm text-gray-400">Subject *</label>
                  <input
                    id="subject"
                    type="text"
                    placeholder="Enter message subject"
                    className="w-full mt-1 p-3 bg-[#ffffff10] border border-[#1e2230] rounded-lg text-sm text-gray-300 focus:outline-none focus:border-[#CECECE] hover:scale-[1.02]"
                    name="subject"
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-400">Message *</label>
                  <textarea
                    id="message"
                    name="message"
                    placeholder="Describe your project or requirements in detail..."
                    className="w-full mt-1 p-3 h-25 bg-[#ffffff10] border border-[#1e2230] rounded-lg text-sm text-gray-300 focus:outline-none focus:border-[#CECECE] hover:scale-[1.02]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full mt-3 py-3 rounded-lg font-medium text-white bg-[#3F8E00] hover:opacity-90 hover:scale-[1.02] transition"
                >
                  Send Message
                </button>
              </form>
            </div>

            <div className="bg-[#ffffff10] p-8 rounded-xl shadow-lg border border-[#1e2230] flex flex-col justify-between h-1/2">
              <div>
                <h2 className="text-2xl font-semibold text-[#CECECE] mb-6">Contact Details</h2>

                <div className="flex items-center justify-between mb-[30px]">
                  <div className="flex items-center gap-[30px] text-gray-300">
                    <FaEnvelope size={20} />
                    <span className="text-[20px]">dtn06052005@gmail.com</span>
                  </div>
                  <button onClick={() => {
                    handleCopy("dtn06052005@gmail.com");
                    setCopied(true);
                  }}>
                    {copied ? (
                      <span className="text-[#CECECE]">Copied!</span>
                    ) : (
                      <FaCopy className="text-gray-400 hover:text-[#3F8E00] hover:scale-[1.2]" />
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-between mb-[30px]">
                  <div className="flex items-center gap-[30px] text-gray-300">
                    <FaPhone size={20} />
                    <span className="text-[20px]">0911398029</span>
                  </div>
                  <button onClick={() => {
                    handleCopy("0911398029");
                    setCopied1(true);
                  }}>
                    {copied1 ? (
                      <span className="text-[#CECECE]">Copied!</span>
                    ) : (
                      <FaCopy className="text-gray-400 hover:text-[#3F8E00] hover:scale-[1.2]" />
                    )}
                  </button>
                </div>

                <hr className="border-[#CECECE] mb-6" />

                <div className="flex justify-center gap-5 text-gray-400">
                  <a
                    href="https://www.linkedin.com/in/nguy%C3%AAn-tr%C6%B0%E1%BB%9Dng-8a075934b/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-[#3F8E00] hover:scale-[1.2] transition"
                  >
                    <FaLinkedinIn size={30} />
                  </a>
                  <a
                    href="https://github.com/trngnneee"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-[#3F8E00] hover:scale-[1.2] transition"
                  >
                    <FaGithub size={30} />
                  </a>
                  <a
                    href="https://www.facebook.com/trngn.neee"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-[#3F8E00] hover:scale-[1.2] transition"
                  >
                    <FaFacebookF size={30} />
                  </a>
                  <a
                    href="https://www.instagram.com/trngn.neee/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-[#3F8E00] hover:scale-[1.2] transition"
                  >
                    <FaInstagram size={30} />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Element>
    </>
  );
}