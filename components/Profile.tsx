import { User, Settings } from "lucide-react";

export function Profile() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 pb-20 md:pb-6">
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center text-2xl font-semibold text-white">
            ME
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Your Name</h1>
            <p className="text-gray-500">Computer Science, 3rd Year</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Email</p>
            <p className="font-medium text-gray-900">you@college.edu</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Roll Number</p>
            <p className="font-medium text-gray-900">CS21B1234</p>
          </div>
        </div>

        <button className="mt-6 w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
          <Settings className="w-4 h-4" />
          Edit Profile
        </button>
      </div>
    </div>
  );
}
