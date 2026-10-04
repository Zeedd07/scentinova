/**
 * Return address printed in the "From (shipper)" block of shipping labels.
 * Empty fields are left off the label.
 */
export const SHIPPER = {
  name: 'SCENTINOVA',
  tagline: 'Heavenly Crafted Perfume',
  /** Street lines, e.g. ['Plot No. 12, Gala No. 4', 'MIDC Area, Andheri (E)'] */
  address: ['Saki Vihar Road, Near Oxford Chamber'],
  city: 'Powai, Mumbai',
  state: 'Maharashtra',
  postalCode: '400072',
  country: 'India',
  phone: '',
  /** Opened by the "Visit our store" QR code. Defaults to the site the admin is using. */
  storeUrl: '',
}

export function shipperAddressReady() {
  return Boolean(SHIPPER.address.length && SHIPPER.city && SHIPPER.postalCode)
}
