/**
 * Enquiry form.
 *
 * The form works entirely without this file — it is a normal POST to
 * /api/enquiry.php, which renders a thank-you page. This upgrades it so the
 * visitor never leaves the page: the submission goes over fetch and the form is
 * replaced in place with a confirmation.
 */

export function initForm() {
  const form = document.querySelector<HTMLFormElement>('[data-enquiry]')
  if (!form) return

  const button = form.querySelector<HTMLButtonElement>('[data-submit]')
  const status = form.querySelector<HTMLElement>('[data-status]')
  const started = form.querySelector<HTMLInputElement>('[data-started]')

  // Stamped by script, so a bot posting the bare form has no plausible value
  // and a human's elapsed time is measurable.
  if (started) started.value = String(Math.floor(Date.now() / 1000))

  const setStatus = (message: string, kind: 'error' | 'ok' | '') => {
    if (!status) return
    status.textContent = message
    status.dataset.kind = kind
  }

  form.addEventListener('submit', async (event) => {
    // Let the browser show its own messages for empty required fields first.
    if (!form.checkValidity()) {
      form.reportValidity()
      return
    }
    event.preventDefault()

    button?.setAttribute('disabled', '')
    const original = button?.textContent ?? ''
    if (button) button.textContent = 'Sending…'
    setStatus('', '')

    try {
      const response = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json', 'X-Requested-With': 'fetch' },
      })
      const result = (await response.json()) as { ok?: boolean; message?: string }

      if (response.ok && result.ok) {
        // Replace the form with the confirmation, so there is nothing left to
        // submit twice and the outcome is unmistakable.
        const done = document.createElement('div')
        done.className = 'form__done'
        done.setAttribute('role', 'status')
        done.innerHTML =
          '<p class="eyebrow">Enquiry sent</p>' +
          '<p class="display display--sub">Thank you — this is with our team.</p>' +
          `<p class="prose">${result.message ?? 'We will be in touch shortly.'}</p>`
        form.replaceWith(done)
        done.scrollIntoView({ behavior: 'smooth', block: 'center' })
        return
      }
      setStatus(result.message ?? 'That did not send. Please try again.', 'error')
    } catch {
      setStatus(
        'That did not send — check your connection, or email technical@panintelng.com directly.',
        'error'
      )
    } finally {
      button?.removeAttribute('disabled')
      if (button && original) button.textContent = original
    }
  })
}
