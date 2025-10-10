/**
 * Format a date range for display
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @param {string} endDate - End date in YYYY-MM-DD format
 * @param {boolean} current - Whether this is current/ongoing
 * @returns {string} Formatted date range
 */
export function formatRange(startDate, endDate, current = false) {
  if (!startDate) return 'Unknown period'
  
  const start = formatDateForDisplay(startDate)
  
  if (current) {
    return `${start} - Present`
  }
  
  if (!endDate) {
    return start
  }
  
  const end = formatDateForDisplay(endDate)
  return `${start} - ${end}`
}

/**
 * Format a date for display (MM/YYYY format)
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @returns {string} Formatted date
 */
function formatDateForDisplay(dateString) {
  if (!dateString) return ''
  
  try {
    const date = new Date(dateString + 'T00:00:00')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    return `${month}/${year}`
  } catch (error) {
    return dateString
  }
}