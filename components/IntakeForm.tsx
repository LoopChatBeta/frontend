"use client";

interface IntakeFormProps {
  onSubmit: (data: IntakeData) => void;
  onClose: () => void;
}

export interface IntakeData {
  name: string;
  email: string;
  phone: string;
  reason: string;
  insurance: string;
}

export default function IntakeForm({ onSubmit, onClose }: IntakeFormProps) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data: IntakeData = {
      name: (form.elements.namedItem("name") as HTMLInputElement).value,
      email: (form.elements.namedItem("email") as HTMLInputElement).value,
      phone: (form.elements.namedItem("phone") as HTMLInputElement).value,
      reason: (form.elements.namedItem("reason") as HTMLTextAreaElement).value,
      insurance: (form.elements.namedItem("insurance") as HTMLInputElement).value,
    };
    onSubmit(data);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">
            Complete Your Intake
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl"
          >
            ✕
          </button>
        </div>

        <p className="text-sm text-gray-500 mb-4">
          Fill out this quick form and we will follow up with you shortly.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            name="name"
            type="text"
            placeholder="Full name"
            required
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            name="email"
            type="email"
            placeholder="Email address"
            required
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            name="phone"
            type="tel"
            placeholder="Phone number"
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            name="insurance"
            type="text"
            placeholder="Insurance provider (e.g. Blue Cross)"
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <textarea
            name="reason"
            placeholder="Reason for visit"
            rows={3}
            required
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
          <button
            type="submit"
            className="bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 mt-1"
          >
            Submit
          </button>
        </form>
      </div>
    </div>
  );
}