"use client";

import { Modal } from "@/components/ui/modal";
import { Shield, Info } from "lucide-react";

interface PermissionDeniedModalProps {
  isOpen: boolean;
  onClose: () => void;
  requiredPermission?: string;
  message?: string;
}

export function PermissionDeniedModal({
  isOpen,
  onClose,
  requiredPermission,
  message,
}: PermissionDeniedModalProps) {
  const title = "Permission required";
  const body = message ||
    `You do not have the required permission${requiredPermission ? ` ("${requiredPermission}")` : ''} to perform this action.`;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-full bg-orange-100 text-orange-700">
          <Shield className="h-5 w-5" />
        </div>
        <div className="space-y-2">
          <p className="text-gray-800">{body}</p>
          <p className="text-sm text-gray-500 flex items-center gap-1">
            <Info className="h-4 w-4" />
            If you believe this is a mistake, please contact your company owner or an administrator.
          </p>
        </div>
      </div>
      <div className="flex justify-end mt-6">
        <button
          onClick={onClose}
          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Close
        </button>
      </div>
    </Modal>
  );
}
