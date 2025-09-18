import { useState, useRef, useEffect } from "react";

type PdfFilter = "Adult" | "Kids" | "Both";

interface CustomDropdownProps {
  value: PdfFilter;
  onChange: (val: PdfFilter) => void;
}

export default function CustomDropdown({ value, onChange }: CustomDropdownProps) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const options: PdfFilter[] = ["Adult", "Kids", "Both"];

  // Close dropdown if clicked outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative w-52" ref={dropdownRef}>
      {/* Selected value */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="w-full px-4 py-2 border-2 border-[#c7a332] rounded-lg bg-white text-[#0b1a3d] font-semibold flex justify-between items-center hover:bg-[#fdf8f3] transition-all duration-200 shadow-sm"
      >
        <span className="truncate">
          {value === "Adult" ? "Adult Only" : value === "Kids" ? "Kids Only" : "Both"}
        </span>
        <span
          className={`ml-2 transform transition-transform duration-300 ${
            open ? "rotate-180" : ""
          }`}
        >
          ▼
        </span>
      </button>

      {/* Dropdown list */}
      <ul
        className={`absolute left-0 top-full mt-1 w-full bg-white border-2 border-[#c7a332] rounded-lg shadow-lg z-50 overflow-hidden transition-all duration-300 ${
          open ? "opacity-100 max-h-60" : "opacity-0 max-h-0 pointer-events-none"
        }`}
      >
        {options.map((opt) => (
          <li
            key={opt}
            onClick={() => {
              onChange(opt);
              setOpen(false);
            }}
            className={`px-4 py-2 cursor-pointer text-[#0b1a3d] transition-all duration-200 rounded-lg ${
              value === opt ? "bg-[#c7a332] text-white font-semibold" : "hover:bg-[#c7a332] hover:text-white"
            }`}
          >
            {opt === "Adult" ? "Adult Only" : opt === "Kids" ? "Kids Only" : "Both"}
          </li>
        ))}
      </ul>
    </div>
  );
}