/** Global email subject template editor, with placeholder hints and live preview. */

import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { getMailSubjectTemplate, saveMailSubjectTemplate } from '../../../../lib/api/settings'

const DEFAULT_TEMPLATE = '{server_name} - UPS Event: {event_code}'

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
}

function previewSubject(template: string): string {
  return template
    .replaceAll('{server_name}', 'Citybox24-KOT')
    .replaceAll('{target_name}', 'PowerWalker')
    .replaceAll('{event_code}', 'ONLINE')
    .replaceAll('{event_title}', 'UPS ONLINE')
}

export function MailSubjectTemplatePanel() {
  const queryClient = useQueryClient()
  const [template, setTemplate] = useState('')
  const [status, setStatus] = useState<{ tone: 'success' | 'error'; message: string } | null>(null)

  const templateQuery = useQuery({
    queryKey: ['settings', 'mail', 'subject-template'],
    queryFn: () => getMailSubjectTemplate(),
  })

  useEffect(() => {
    const data = asRecord(templateQuery.data).data
    const entry = asRecord(data)
    const loaded = typeof entry.template === 'string' && entry.template ? entry.template : ''
    setTemplate(loaded || (typeof entry.default_template === 'string' ? entry.default_template : DEFAULT_TEMPLATE))
  }, [templateQuery.data])

  const saveMutation = useMutation({
    mutationFn: () => saveMailSubjectTemplate(template.trim()),
    onSuccess: async () => {
      setStatus({ tone: 'success', message: 'Subject template saved' })
      await queryClient.invalidateQueries({ queryKey: ['settings', 'mail', 'subject-template'] })
    },
    onError: (error: unknown) => {
      setStatus({ tone: 'error', message: error instanceof Error ? error.message : 'Failed to save subject template' })
    },
  })

  return (
    <div className="options_card mt-4">
      <div className="card_header">
        <div className="notification_header">
          <h2>Email Subject Format</h2>
        </div>
        <p className="card_subtitle">
          Customize the subject line used for status-change notification emails. Available placeholders:{' '}
          <code>{'{server_name}'}</code>, <code>{'{target_name}'}</code>, <code>{'{event_code}'}</code>,{' '}
          <code>{'{event_title}'}</code>.
        </p>
      </div>

      <div className="options_form_group">
        <input
          type="text"
          className="options_input"
          value={template}
          onChange={(event) => setTemplate(event.target.value)}
          placeholder={DEFAULT_TEMPLATE}
        />
        <p className="card_subtitle" style={{ marginTop: '6px' }}>
          Preview: <em>{previewSubject(template || DEFAULT_TEMPLATE)}</em>
        </p>
      </div>

      {status ? (
        <div className={`options_alert options_alert_${status.tone}`} style={{ marginTop: '8px' }}>
          {status.message}
        </div>
      ) : null}

      <div style={{ marginTop: '12px' }}>
        <button
          type="button"
          className="options_btn"
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
        >
          <i className={`fas ${saveMutation.isPending ? 'fa-spinner fa-spin' : 'fa-save'}`} />{' '}
          {saveMutation.isPending ? 'Saving...' : 'Save Subject Format'}
        </button>
      </div>
    </div>
  )
}
