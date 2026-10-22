import Swal from 'sweetalert2';

export const alert = (typeof Swal.mixin === 'function' ? Swal.mixin({
  background: '#181A20',
  color: '#EAECEF',
  confirmButtonColor: '#F0B90B',
  cancelButtonColor: '#2B313A',
  customClass: {
    popup: 'border border-[#2B313A] rounded-lg',
    confirmButton: 'text-black font-semibold uppercase tracking-wider px-5 py-2 rounded text-xs',
    cancelButton: 'text-gray-300 font-semibold uppercase tracking-wider px-5 py-2 rounded text-xs',
  },
}) : Swal) as typeof Swal;

export { Swal };
export default alert;
