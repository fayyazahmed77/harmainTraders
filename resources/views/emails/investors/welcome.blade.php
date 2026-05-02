<x-mail::message>
# Welcome to Harmain Traders, {{ $user->name }}!

We are pleased to inform you that your Investor Portal account has been successfully created. You can now track your investments, monitor profits, and manage financial requests directly from our secure platform.

### Your Access Credentials
To access your dashboard, please use the following credentials:

<x-mail::panel>
**Email:** {{ $user->email }}  
**Password:** {{ $password }}
</x-mail::panel>

<x-mail::button :url="$loginUrl" color="success">
Access Investor Dashboard
</x-mail::button>

### What you can do in the portal:
*   **Real-time Ledger:** View your investment history and rolling balance.
*   **Profit Tracking:** Monitor monthly profit distributions.
*   **Quick Requests:** Submit withdrawal or reinvestment requests with one click.
*   **Financial Reports:** Download audit-ready statements.

*Important: For security reasons, we recommend changing your password after your first login.*

If you have any questions or require assistance, please do not hesitate to contact our support team.

Regards,  
**Harmain Traders Management**
</x-mail::message>
