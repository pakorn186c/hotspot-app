import HotspotIcon from './linxdot.svg'
import { MakerHotspot } from '../hotspotMakerTypes'
import ANTENNAS from './antennas'

const Linxdot = {
  name: 'Linxdot Hotspot',
  icon: HotspotIcon,
  onboardType: 'BLE',
  translations: {
    en: {
      diagnostic:
        '<b><white>Diagnostic support allows Linxdot to identify issues with your Hotspot in a secure way.</white></b>\n\nLinxdot will never have access to private keys and will only ever be able to access your Hotspot and not any other devices on your Network.\n\nIf you would like to opt-out of diagnostic support please email <purple><b>support@linxdot.com</b></purple> from the email used to purchase the Hotspot.',
      power: [
        'Attach the antenna and plug in the provided power adapter.',
        'The Hotspot LEDs will blink white when the device is powered on.',
      ],
      bluetooth: [
        'There is no pairing button on the Linxdot Hotspot.',
        'Bluetooth pairing is automatically enabled for 5 minutes after the Linxdot Hotspot is powered on.\n\nHotspot can take up to 1 minute to fully boot up.',
      ],
    },
    ja: {
      diagnostic:
        '<b><white>診断サポートにより、LinxdotはHotspotの問題を安全な方法で特定できます。</white></b>\n\nLinxdotが秘密キーにアクセスすることはありません。お使いのHotspotにのみアクセスし、ネットワーク上の他のデバイスにはアクセスしません。\n\n診断サポートをオプトアウトする場合は、Hotspotの購入時に使用したメールアドレスを使用して、<purple><b>support@linxdot.com</b></purple>までメールでご連絡ください。',
      power: [
        'アンテナを取り付けてデバイスに差し込みます',
        'Linxdot Hotspotの電源を入れると、LEDバーが青色で点灯します。',
      ],
      bluetooth: [
        'Linxdot Hotspotにペアリングボタンはありません。',
        'Linxdot Hotspotの電源がオンになると、自動的にBluetoothが5分間有効になります。\n\nHotspotが完全に起動するまでに最大で1分かかる場合があります。',
      ],
    },
    ko: {
      diagnostic:
        '<b><white>Linxdot 진단 지원을 통해 안전한 방법으로 Hotspot에서 발생하는 문제를 식별할 수 있습니다.</white></b>\n\nLinxdot은 개인 키에 대한 액세스 권한이 없으며 네트워크 내의 다른 기기를 제외하고 Hotspot에만 액세스할 수 있습니다.\n\n진단 지원을 선택 취소하려면 Hotspot을 구매할 때 사용한 이메일을 통해 <purple><b>support@linxdot.com</b></purple>으로 이메일을 보내주시기 바랍니다.',
      power: [
        '안테나를 부착하고 기기를 연결합니다.',
        '전원이 켜지면 Linxdot Hotspot에 LED 바가 파란색으로 표시됩니다.',
      ],
      bluetooth: [
        'Linxdot Hotspot에는 페어링 버튼이 없습니다.',
        'Linxdot Hotspot의 전원이 켜진 후 5분 동안 Bluetooth가 자동으로 활성화됩니다.\n\nHotspot이 완전히 부팅되는 데 최대 1분이 소요될 수 있습니다.',
      ],
    },
    zh: {
      diagnostic:
        '<b><white>诊断支持帮助 Linxdot 安全确认您的 Hotspot 问题。</white></b>\n\nLinxdot 绝不会访问私人密钥，且仅可访问您的 Hotspot，无法访问您网络中的任何其他设备。\n\n若选择退出诊断支持，请使用购买 Hotspot 时提供的电子邮箱发送请求至 <purple><b>support@linxdot.com</b></purple>。',
      power: [
        '连接天线并插接设备',
        '开机后，Linxdot Hotspot 将亮起蓝色 LED 指示灯。',
      ],
      bluetooth: [
        'Linxdot Hotspot 上没有配对按钮。',
        'Linxdot Hotspot 开机后，蓝牙会自动启用 5 分钟。\n\nHotspot 最多需要 1 分钟即可完全启动。',
      ],
    },
  },
  icon: HotspotIcon,
  antenna: { default: ANTENNAS.LINXDOT },
} as MakerHotspot

export default { Linxdot }
