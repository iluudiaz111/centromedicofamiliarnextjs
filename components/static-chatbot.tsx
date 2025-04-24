"use client"

export function StaticChatbot() {
  return (
    <div className="fixed bottom-4 right-4 z-[9999]" style={{ pointerEvents: "all" }}>
      <div
        className="bg-sky-600 text-white rounded-full h-14 w-14 flex items-center justify-center shadow-lg cursor-pointer"
        onClick={() => alert("Chatbot estático - Solo para pruebas de visibilidad")}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
      </div>
    </div>
  )
}
