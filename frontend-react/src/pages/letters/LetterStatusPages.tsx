import LetterQueuePage from './LetterQueuePage'
import { useLettersI18n } from '../../hooks/useLettersI18n'

export function RejectedLettersPage() {
  const { t } = useLettersI18n()
  return <LetterQueuePage title={t('rejectedLetters')} status="rejected" />
}

export function AwaitingEditingLettersPage() {
  const { t } = useLettersI18n()
  return <LetterQueuePage title={t('awaitingEditing')} status="awaiting_editing" />
}

export function AwaitingApprovalLettersPage() {
  const { t } = useLettersI18n()
  return <LetterQueuePage title={t('awaitingApproval')} status="awaiting_approval" allowBulkApprove />
}

export function AwaitingSignatureLettersPage() {
  const { t } = useLettersI18n()
  return <LetterQueuePage title={t('awaitingSignature')} status="awaiting_signature" allowBulkSign />
}

export function ReadyToSendLettersPage() {
  const { t } = useLettersI18n()
  return <LetterQueuePage title={t('readyToSend')} status="ready_to_send" allowBulkSend />
}

export function SentLettersPage() {
  const { t } = useLettersI18n()
  return <LetterQueuePage title={t('sentLetters')} status="sent" />
}

export function PendingLettersPage() {
  const { t } = useLettersI18n()
  return <LetterQueuePage title={t('pendingLetters')} statusIn="awaiting_editing,awaiting_approval,awaiting_signature,ready_to_send" />
}

export function PrintableLettersPage() {
  const { t } = useLettersI18n()
  return <LetterQueuePage title={t('printLetters')} statusIn="ready_to_send,sent" allowPrint allowDownload />
}

export function DownloadableLettersPage() {
  const { t } = useLettersI18n()
  return <LetterQueuePage title={t('downloadLetters')} statusIn="ready_to_send,sent" allowDownload />
}
