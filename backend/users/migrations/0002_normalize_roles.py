from django.db import migrations


def forwards_func(apps, schema_editor):
    User = apps.get_model('users', 'User')
    # map old detailed roles to the new canonical roles
    admin_values = {
        'SYSTEM_ADMIN', 'DIRECTOR', 'GOVERNOR', 'COUNTY_SEC', 'COUNTY_EXECUTIVE_SECRETARY'
    }
    manager_values = {
        'DEPARTMENT_ADMIN', 'CHIEF_OFFICER'
    }
    # everything else becomes MEMBER

    for user in User.objects.all():
        old = (user.role or '').upper()
        if old in admin_values:
            user.role = 'ADMIN'
            user.is_staff = True
        elif old in manager_values:
            user.role = 'MANAGER'
            # keep existing is_staff if set; otherwise mark staff
            if not user.is_staff:
                user.is_staff = True
        else:
            user.role = 'MEMBER'
        user.save()


def reverse_func(apps, schema_editor):
    # Not reversible: we don't map back to original detailed roles
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(forwards_func, reverse_func),
    ]
