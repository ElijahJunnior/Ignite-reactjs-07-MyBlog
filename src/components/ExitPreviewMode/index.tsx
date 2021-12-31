import styles from './styles.module.scss';
import Link from 'next/link'

type ExitPreviewModeProps = {
    className?: string
}

export function ExitPreviewMode(props: ExitPreviewModeProps) {

    return (
        <Link href='/api/exit-preview'>
            <a className={`${styles.exitButton} ${props?.className || ''}`}>
                Sair do modo Preview
            </a>
        </Link>
    )
}